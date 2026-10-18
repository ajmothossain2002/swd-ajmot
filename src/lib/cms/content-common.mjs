import { ApiError } from "./validation.mjs";

export async function inTransaction(db, operation) {
  return db.$transaction((transaction) => operation(transaction));
}

export async function verifyCoverImage(db, coverImageId) {
  if (coverImageId == null) return;
  const exists = await db.mediaAsset.findUnique({ where: { id: coverImageId }, select: { id: true } });
  if (!exists) throw new ApiError(404, "MEDIA_NOT_FOUND", "The selected media asset was not found.");
}

function tagSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function resolveTags(db, names = []) {
  const bySlug = new Map();
  for (const name of names) {
    const slug = tagSlug(name);
    if (!slug) throw new ApiError(400, "INVALID_TAG", "Each tag must contain at least one letter or number.");
    const existingName = bySlug.get(slug);
    if (existingName && existingName.toLowerCase() !== name.toLowerCase()) {
      throw new ApiError(400, "DUPLICATE_TAG", "Tags must have distinct slugs.");
    }
    bySlug.set(slug, name.trim());
  }
  const result = [];
  for (const [slug, name] of bySlug) {
    result.push(await db.tag.upsert({ where: { slug }, update: {}, create: { slug, name }, select: { id: true } }));
  }
  return result.map(({ id }) => ({ id }));
}

export function paginated(data, total, page, pageSize) {
  return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export function whereSearch(query, fields) {
  if (!query.q) return {};
  return { OR: fields.map((field) => ({ [field]: { contains: query.q, mode: "insensitive" } })) };
}

export function parseEnumFilter(value, allowed, key) {
  if (value === undefined) return undefined;
  if (!allowed.includes(value)) throw new ApiError(400, "INVALID_QUERY", `The ${key} filter is invalid.`);
  return value;
}

export function publishedData(data, current = null) {
  if (data.status === "DRAFT") {
    if (data.publishedAt) throw new ApiError(400, "INVALID_PUBLICATION", "Draft content cannot have a publication date.");
    return { ...data, publishedAt: null };
  }
  if (data.status === "PUBLISHED") {
    return { ...data, publishedAt: data.publishedAt ? new Date(data.publishedAt) : current?.publishedAt ?? new Date() };
  }
  if (data.publishedAt !== undefined) {
    if (data.publishedAt === null) {
      if (current?.status === "PUBLISHED" && data.status !== "DRAFT") {
        throw new ApiError(400, "INVALID_PUBLICATION", "Move the content to DRAFT before clearing its publication date.");
      }
      return { ...data, publishedAt: null };
    }
    if (current?.status !== "PUBLISHED") throw new ApiError(400, "INVALID_PUBLICATION", "Set status to PUBLISHED before setting a publication date.");
    return { ...data, publishedAt: new Date(data.publishedAt) };
  }
  return data;
}
