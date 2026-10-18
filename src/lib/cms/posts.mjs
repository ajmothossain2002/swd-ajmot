import { ApiError, postCreateSchema, postPatchSchema, validationData } from "./validation.mjs";
import { inTransaction, paginated, parseEnumFilter, publishedData, resolveTags, verifyCoverImage, whereSearch } from "./content-common.mjs";

const include = {
  coverImage: { select: { id: true, secureUrl: true, altText: true, width: true, height: true, format: true } },
  tags: { select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } },
};

export async function listPosts(db, query) {
  const status = parseEnumFilter(query.filters.status, ["DRAFT", "PUBLISHED"], "status");
  const category = query.filters.category;
  if (category !== undefined && (!category.trim() || category.length > 100)) throw new ApiError(400, "INVALID_QUERY", "The category filter is invalid.");
  const where = {
    ...whereSearch(query, ["title", "slug", "description", "category"]),
    ...(status ? { status } : {}),
    ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
  };
  const [data, total] = await Promise.all([
    db.blogPost.findMany({ where, include, orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    db.blogPost.count({ where }),
  ]);
  return paginated(data, total, query.page, query.pageSize);
}

export async function getPost(db, id) {
  const post = await db.blogPost.findUnique({ where: { id }, include });
  if (!post) throw new ApiError(404, "NOT_FOUND", "The requested post was not found.");
  return post;
}

export async function createPost(db, input) {
  const validated = validationData(postCreateSchema, input);
  const data = publishedData(validated);
  return inTransaction(db, async (tx) => {
    const { tags, coverImageId, ...fields } = data;
    const redirect = await tx.blogPostSlugRedirect.findUnique({ where: { oldSlug: fields.slug }, select: { blogPostId: true } });
    if (redirect) throw new ApiError(409, "SLUG_RESERVED", "This article slug is reserved by an earlier article URL.");
    await verifyCoverImage(tx, coverImageId);
    const tagRecords = await resolveTags(tx, tags);
    return tx.blogPost.create({ data: { ...fields, ...(coverImageId !== undefined ? { coverImageId } : {}), ...(tags !== undefined ? { tags: { connect: tagRecords } } : {}) }, include });
  });
}

export async function updatePost(db, id, input) {
  const validated = validationData(postPatchSchema, input);
  return inTransaction(db, async (tx) => {
    const current = await tx.blogPost.findUnique({ where: { id }, select: { slug: true, status: true, publishedAt: true } });
    if (!current) throw new ApiError(404, "NOT_FOUND", "The requested post was not found.");
    const previousSlug = current.slug;
    if (validated.slug && validated.slug !== previousSlug) {
      const redirect = await tx.blogPostSlugRedirect.findUnique({ where: { oldSlug: validated.slug }, select: { blogPostId: true } });
      if (redirect && redirect.blogPostId !== id) throw new ApiError(409, "SLUG_RESERVED", "This article slug is reserved by an earlier article URL.");
    }
    const data = publishedData(validated, current);
    const { tags, coverImageId, ...fields } = data;
    if (coverImageId !== undefined) await verifyCoverImage(tx, coverImageId);
    const tagRecords = tags === undefined ? undefined : await resolveTags(tx, tags);
    const updated = await tx.blogPost.update({ where: { id }, data: { ...fields, ...(coverImageId !== undefined ? { coverImageId } : {}), ...(tags !== undefined ? { tags: { set: tagRecords } } : {}) }, include });
    if (validated.slug && validated.slug !== previousSlug) {
      await tx.blogPostSlugRedirect.upsert({ where: { oldSlug: previousSlug }, create: { oldSlug: previousSlug, blogPostId: id }, update: { blogPostId: id } });
    }
    return updated;
  });
}

export async function deletePost(db, id) {
  try {
    await db.blogPost.delete({ where: { id } });
  } catch (error) {
    if (error?.code === "P2025") throw new ApiError(404, "NOT_FOUND", "The requested post was not found.");
    throw error;
  }
  return { deleted: true, id };
}
