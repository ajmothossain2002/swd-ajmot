import { z } from "zod";

export const MAX_BODY_BYTES = 1024 * 1024;
const slugSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase slug with hyphens.");
const idSchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const text = (maximum) => z.string().trim().min(1).max(maximum);
const optionalText = (maximum) => z.string().trim().max(maximum).nullable().optional();
const textList = z.array(text(200)).max(30);
const tags = z.array(text(40)).max(20).optional();
const imageId = idSchema.nullable().optional();
const mediaAssetIds = z.array(idSchema).max(20).optional().refine((ids) => !ids || new Set(ids).size === ids.length, "Choose each image once.");
const dateValue = z.string().datetime({ offset: true }).nullable().optional();

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const projectShape = {
  title: text(160),
  slug: slugSchema,
  summary: text(600),
  category: text(100),
  status: text(100),
  visibility: z.enum(["PRIVATE", "PUBLIC"]),
  featured: z.boolean(),
  sortOrder: z.number().int().min(-10000).max(10000),
  coverImageId: imageId,
  tags,
};
export const projectCreateSchema = z.object({
  ...projectShape,
  visibility: projectShape.visibility.default("PRIVATE"),
  featured: projectShape.featured.default(false),
  sortOrder: projectShape.sortOrder.default(0),
}).strict();
export const projectPatchSchema = z.object(projectShape).partial().strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

const publication = {
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: dateValue,
};
function publicationSchema(schema) {
  return schema.superRefine((value, context) => {
    if (value.status === "DRAFT" && value.publishedAt) {
      context.addIssue({ code: "custom", path: ["publishedAt"], message: "Draft content cannot have a publication date." });
    }
  });
}

const postShape = {
  title: text(180),
  slug: slugSchema,
  description: text(500),
  markdown: z.string().max(500_000),
  category: text(100),
  status: publication.status,
  publishedAt: publication.publishedAt,
  coverImageId: imageId,
  tags,
};
export const postCreateSchema = publicationSchema(z.object({
  ...postShape,
  status: publication.status.default("DRAFT"),
  publishedAt: publication.publishedAt.default(null),
}).strict());
export const postPatchSchema = publicationSchema(z.object(postShape).partial().strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update."));

const publicLinkSchema = z.object({
  label: text(80),
  url: z.string().url().max(2048),
  approved: z.literal(true),
}).strict().superRefine((link, context) => {
  try {
    const url = new URL(link.url);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) throw new Error();
  } catch {
    context.addIssue({ code: "custom", path: ["url"], message: "Use an approved HTTPS URL without embedded credentials." });
  }
});
const challengeSchema = z.object({ title: text(160), description: text(1000) }).strict();
const caseStudyShape = {
  slug: slugSchema,
  projectId: idSchema,
  problem: optionalText(5000),
  businessContext: optionalText(5000),
  role: optionalText(500),
  approach: optionalText(8000),
  capabilities: textList,
  capabilityLabel: optionalText(120),
  challenges: z.array(challengeSchema).max(30).nullable().optional(),
  architectureNote: optionalText(5000),
  technologies: textList,
  evidence: z.array(text(2000)).max(30),
  publicLinks: z.array(publicLinkSchema).max(20).nullable().optional(),
  mediaAssetIds,
  status: publication.status,
  publishedAt: publication.publishedAt,
};
export const caseStudyCreateSchema = publicationSchema(z.object({
  ...caseStudyShape,
  status: publication.status.default("DRAFT"),
  publishedAt: publication.publishedAt.default(null),
  capabilities: caseStudyShape.capabilities.default([]),
  technologies: caseStudyShape.technologies.default([]),
  evidence: caseStudyShape.evidence.default([]),
}).strict());
export const caseStudyPatchSchema = publicationSchema(z.object(caseStudyShape).partial().strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update."));

export function parseId(id) {
  const result = idSchema.safeParse(id);
  if (!result.success) throw new ApiError(400, "INVALID_ID", "The requested ID is invalid.");
  return result.data;
}

export async function readJson(request) {
  const type = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(type)) throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Send the request as JSON.");
  const announced = Number(request.headers.get("content-length"));
  if (Number.isFinite(announced) && announced > MAX_BODY_BYTES) throw new ApiError(413, "BODY_TOO_LARGE", "The request body is too large.");
  if (!request.body) throw new ApiError(400, "INVALID_JSON", "The request body must contain valid JSON.");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new ApiError(413, "BODY_TOO_LARGE", "The request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
  } catch {
    throw new ApiError(400, "INVALID_JSON", "The request body must contain valid JSON.");
  }
}

export function parseListQuery(request, allowedFilters = []) {
  const url = new URL(request.url);
  const allowed = new Set(["page", "pageSize", "q", ...allowedFilters]);
  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key) || url.searchParams.getAll(key).length > 1) {
      throw new ApiError(400, "INVALID_QUERY", "One or more query parameters are invalid.");
    }
  }
  const integer = (key, fallback, max) => {
    const raw = url.searchParams.get(key);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw)) throw new ApiError(400, "INVALID_QUERY", "One or more query parameters are invalid.");
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new ApiError(400, "INVALID_QUERY", "One or more query parameters are invalid.");
    return value;
  };
  const filters = {};
  for (const key of allowedFilters) {
    const value = url.searchParams.get(key);
    if (value !== null) filters[key] = value;
  }
  return {
    page: integer("page", 1, 100000),
    pageSize: integer("pageSize", 20, 100),
    q: (url.searchParams.get("q") ?? "").trim().slice(0, 120),
    filters,
  };
}

export function validationData(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Review the provided fields and try again.");
  }
  return result.data;
}

export function toApiError(error) {
  if (error instanceof ApiError) return error;
  const code = error?.code;
  if (code === "P2002") return new ApiError(409, "DUPLICATE_VALUE", "A record with one of these unique values already exists.");
  if (code === "P2003") return new ApiError(409, "RELATION_CONFLICT", "The requested change conflicts with related content.");
  if (code === "P2025") return new ApiError(404, "NOT_FOUND", "The requested record was not found.");
  if (code === "P2000") return new ApiError(400, "INVALID_VALUE", "One or more values exceed the allowed size.");
  if (typeof code === "string" && (/^P10\d\d$/.test(code) || ["P2021", "P2022"].includes(code))) {
    return new ApiError(503, "SERVICE_UNAVAILABLE", "The content service is temporarily unavailable.");
  }
  return new ApiError(500, "INTERNAL_ERROR", "The request could not be completed.");
}

export function errorResponse(error) {
  const safe = toApiError(error);
  return Response.json({ error: { code: safe.code, message: safe.message } }, { status: safe.status });
}
