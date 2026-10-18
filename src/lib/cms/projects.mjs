import { ApiError, projectCreateSchema, projectPatchSchema, validationData } from "./validation.mjs";
import { inTransaction, paginated, parseEnumFilter, resolveTags, verifyCoverImage, whereSearch } from "./content-common.mjs";

const include = {
  coverImage: { select: { id: true, secureUrl: true, altText: true, width: true, height: true, format: true } },
  tags: { select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } },
};

export async function listProjects(db, query) {
  const visibility = parseEnumFilter(query.filters.visibility, ["PRIVATE", "PUBLIC"], "visibility");
  const featured = query.filters.featured;
  if (featured !== undefined && featured !== "true" && featured !== "false") throw new ApiError(400, "INVALID_QUERY", "The featured filter is invalid.");
  const category = query.filters.category;
  if (category !== undefined && (!category.trim() || category.length > 100)) throw new ApiError(400, "INVALID_QUERY", "The category filter is invalid.");
  const where = {
    ...whereSearch(query, ["title", "slug", "summary", "category"]),
    ...(visibility ? { visibility } : {}),
    ...(featured !== undefined ? { featured: featured === "true" } : {}),
    ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
  };
  const [data, total] = await Promise.all([
    db.project.findMany({ where, include, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    db.project.count({ where }),
  ]);
  return paginated(data, total, query.page, query.pageSize);
}

export async function getProject(db, id) {
  const project = await db.project.findUnique({ where: { id }, include });
  if (!project) throw new ApiError(404, "NOT_FOUND", "The requested project was not found.");
  return project;
}

export async function createProject(db, input) {
  const data = validationData(projectCreateSchema, input);
  return inTransaction(db, async (tx) => {
    const { tags, coverImageId, ...fields } = data;
    const redirect = await tx.projectSlugRedirect.findUnique({ where: { oldSlug: fields.slug }, select: { projectId: true } });
    if (redirect) throw new ApiError(409, "SLUG_RESERVED", "This project slug is reserved by an earlier project URL.");
    await verifyCoverImage(tx, coverImageId);
    const tagRecords = await resolveTags(tx, tags);
    return tx.project.create({ data: { ...fields, ...(coverImageId !== undefined ? { coverImageId } : {}), ...(tags !== undefined ? { tags: { connect: tagRecords } } : {}) }, include });
  });
}

export async function updateProject(db, id, input) {
  const data = validationData(projectPatchSchema, input);
  return inTransaction(db, async (tx) => {
    const { tags, coverImageId, ...fields } = data;
    const current = await tx.project.findUnique({ where: { id }, select: { slug: true } });
    if (!current) throw new ApiError(404, "NOT_FOUND", "The requested project was not found.");
    const previousSlug = current.slug;
    if (fields.slug && fields.slug !== previousSlug) {
      const redirect = await tx.projectSlugRedirect.findUnique({ where: { oldSlug: fields.slug }, select: { projectId: true } });
      if (redirect && redirect.projectId !== id) throw new ApiError(409, "SLUG_RESERVED", "This project slug is reserved by an earlier project URL.");
    }
    if (coverImageId !== undefined) await verifyCoverImage(tx, coverImageId);
    const tagRecords = tags === undefined ? undefined : await resolveTags(tx, tags);
    try {
      const updated = await tx.project.update({ where: { id }, data: { ...fields, ...(coverImageId !== undefined ? { coverImageId } : {}), ...(tags !== undefined ? { tags: { set: tagRecords } } : {}) }, include });
      if (fields.slug && fields.slug !== previousSlug) {
        await tx.projectSlugRedirect.upsert({ where: { oldSlug: previousSlug }, create: { oldSlug: previousSlug, projectId: id }, update: { projectId: id } });
      }
      return updated;
    } catch (error) {
      if (error?.code === "P2025") throw new ApiError(404, "NOT_FOUND", "The requested project was not found.");
      throw error;
    }
  });
}

export async function deleteProject(db, id) {
  const attached = await db.caseStudy.findUnique({ where: { projectId: id }, select: { id: true } });
  if (attached) throw new ApiError(409, "PROJECT_HAS_CASE_STUDY", "Remove or reassign the case study before deleting this project.");
  try {
    await db.project.delete({ where: { id } });
  } catch (error) {
    if (error?.code === "P2025") throw new ApiError(404, "NOT_FOUND", "The requested project was not found.");
    if (error?.code === "P2003") throw new ApiError(409, "PROJECT_HAS_CASE_STUDY", "Remove or reassign the case study before deleting this project.");
    throw error;
  }
  return { deleted: true, id };
}
