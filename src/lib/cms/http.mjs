import { ApiError, errorResponse, parseId, parseListQuery, readJson } from "./validation.mjs";

async function authorized(request, authorize, action) {
  try {
    const access = await authorize(request);
    if (access instanceof Response) return access;
    if (!access?.ok) return Response.json({ error: { code: "UNAUTHORIZED", message: "Sign in as an administrator to continue." } }, { status: 401 });
    return await action();
  } catch (error) {
    return errorResponse(error);
  }
}

export function createCollectionHandlers({ authorize, db, service, filters = [], afterMutation = async () => {} }) {
  return {
    GET(request) {
      return authorized(request, authorize, async () => {
        const query = parseListQuery(request, filters);
        return Response.json(await service.list(db, query));
      });
    },
    POST(request) {
      return authorized(request, authorize, async () => {
        const result = await service.create(db, await readJson(request));
        await afterMutation({ operation: "create", result });
        return Response.json({ data: result }, { status: 201 });
      });
    },
  };
}

export function createItemHandlers({ authorize, db, service, afterMutation = async () => {} }) {
  return {
    GET(request, context) {
      return authorized(request, authorize, async () => {
        const { id } = await context.params;
        return Response.json({ data: await service.get(db, parseId(id)) });
      });
    },
    PATCH(request, context) {
      return authorized(request, authorize, async () => {
        const { id } = await context.params;
        const previous = await service.get(db, parseId(id));
        const result = await service.update(db, parseId(id), await readJson(request));
        await afterMutation({ operation: "update", previous, result });
        return Response.json({ data: result });
      });
    },
    DELETE(request, context) {
      return authorized(request, authorize, async () => {
        const { id } = await context.params;
        const body = await readJson(request);
        if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 || body.confirmation !== "DELETE") {
          throw new ApiError(400, "CONFIRMATION_REQUIRED", "Confirm deletion by sending {\"confirmation\":\"DELETE\"}.");
        }
        const previous = await service.get(db, parseId(id));
        const result = await service.delete(db, parseId(id));
        await afterMutation({ operation: "delete", previous, result });
        return Response.json({ data: result });
      });
    },
  };
}
