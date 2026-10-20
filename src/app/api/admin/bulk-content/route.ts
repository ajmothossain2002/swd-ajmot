import "server-only";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { prisma } from "@/lib/prisma";
import { createCmsJson, createCmsWorkbook, importCmsWorkbook, inspectCmsWorkbook, normalizeCmsJson, WorkbookImportError, type ContentCollection } from "@/lib/cms/excel-workbook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const validCollections = new Set<ContentCollection>(["projects", "caseStudies", "blogPosts"]);

async function readBoundedBody(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_UPLOAD_BYTES) throw new Error("UPLOAD_TOO_LARGE");
  if (!request.body) throw new Error("EMPTY_UPLOAD");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_UPLOAD_BYTES) {
      await reader.cancel();
      throw new Error("UPLOAD_TOO_LARGE");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

function safeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return {};
  const details: { name?: string; code?: string } = {};
  if ("name" in error && typeof error.name === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(error.name)) details.name = error.name;
  if ("code" in error && typeof error.code === "string" && /^[A-Z][A-Z0-9_]{1,31}$/.test(error.code)) details.code = error.code;
  return details;
}

export async function GET(request: Request) {
  const authorization = await requireAdminApi(request);
  if (authorization instanceof Response) return authorization;

  try {
    const searchParams = new URL(request.url).searchParams;
    const collection = searchParams.get("collection");
    if (!collection || !validCollections.has(collection as ContentCollection)) {
      return Response.json({ error: { code: "INVALID_COLLECTION", message: "Choose projects, caseStudies, or blogPosts." } }, { status: 400 });
    }
    const contentCollection = collection as ContentCollection;
    const template = searchParams.get("template") === "1";
    if (searchParams.get("format") === "json") {
      const content = await createCmsJson(prisma, contentCollection);
      return new Response(JSON.stringify(content, null, 2), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": `attachment; filename="${contentCollection}-cms-export.json"`,
          "cache-control": "private, no-store",
        },
      });
    }
    const workbook = await createCmsWorkbook(prisma, contentCollection, template);
    return new Response(new Uint8Array(workbook), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${contentCollection}-cms-${template ? "template" : "export"}.xlsx"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    const details = safeErrorDetails(error);
    console.error("CMS collection export failed.", details);
    return Response.json({ error: { code: "EXPORT_UNAVAILABLE", databaseCode: details.code, message: "The collection could not be exported because its database query failed. Check the displayed database code and server logs." } }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const authorization = await requireAdminApi(request);
  if (authorization instanceof Response) return authorization;

  let formData: FormData;
  try {
    const bytes = await readBoundedBody(request);
    const boundedRequest = new Request(request.url, { method: "POST", headers: request.headers, body: bytes });
    formData = await boundedRequest.formData();
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "UPLOAD_TOO_LARGE";
    return Response.json({ error: { code: tooLarge ? "UPLOAD_TOO_LARGE" : "INVALID_UPLOAD", message: tooLarge ? "Choose a file smaller than 5 MB." : "Upload a valid .xlsx workbook or .json content pack." } }, { status: tooLarge ? 413 : 400 });
  }

  const mode = formData.get("mode");
  const collection = formData.get("collection");
  const file = formData.get("file");
  if ((mode !== "preview" && mode !== "apply") || typeof collection !== "string" || !validCollections.has(collection as ContentCollection) || !(file instanceof File) || !/\.(xlsx|json)$/i.test(file.name)) {
    return Response.json({ error: { code: "INVALID_UPLOAD", message: "Choose a content section, a .xlsx or .json file, and preview it before importing." } }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const isJson = file.name.toLowerCase().endsWith(".json");
  const contentCollection = collection as ContentCollection;

  try {
    const normalized = isJson ? await normalizeCmsJson(bytes, contentCollection) : bytes;
    if (!isJson && (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b)) {
      return Response.json({ error: { code: "INVALID_UPLOAD", message: "The selected file is not a valid Excel .xlsx workbook." } }, { status: 400 });
    }
    if (mode === "preview") {
      const preview = await inspectCmsWorkbook(normalized, contentCollection);
      if (preview.issues.length) {
        return Response.json({ data: { counts: preview.counts, issues: preview.issues } }, { status: 422 });
      }
      return Response.json({ data: { counts: preview.counts, issues: [] } });
    }

    const result = await importCmsWorkbook(prisma, normalized, contentCollection);
    for (const path of ["/", "/work", "/work/[slug]", "/blog", "/blog/[slug]", "/sitemap.xml"]) {
      try {
        revalidatePath(path, path.includes("[") ? "page" : undefined);
      } catch {
        // Content remains committed even if cache invalidation fails.
      }
    }
    return Response.json({ data: result });
  } catch (error) {
    if (error instanceof WorkbookImportError) {
      return Response.json({ data: { issues: error.issues } }, { status: 422 });
    }
    const details = safeErrorDetails(error);
    console.error("CMS collection import failed.", details);
    const missingSchema = details.code === "P2021" || details.code === "P2022";
    return Response.json({
      error: {
        code: missingSchema ? "DATABASE_SCHEMA_OUT_OF_DATE" : "IMPORT_UNAVAILABLE",
        databaseCode: details.code,
        message: missingSchema
          ? "The database is missing a CMS table or column. Apply the latest database migrations, then retry. No rows were imported."
          : `The import could not be completed because of a database error${details.code ? ` (${details.code})` : ""}. No rows were imported. Check the server logs and migration status.`,
      },
    }, { status: 503 });
  }
}
