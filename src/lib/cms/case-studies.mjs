import { ApiError, caseStudyCreateSchema, caseStudyPatchSchema, validationData } from "./validation.mjs";
import { inTransaction, paginated, parseEnumFilter, publishedData, whereSearch } from "./content-common.mjs";

const include = {
  project: { select: { id: true, slug: true, title: true, visibility: true, status: true } },
  screenshots: { orderBy: { sortOrder: "asc" }, include: { mediaAsset: { select: { id: true, secureUrl: true, altText: true, width: true, height: true, format: true, providerId: true } } } },
};

async function verifyMediaAssets(tx, ids) {
  if (ids === undefined) return;
  const found = await tx.mediaAsset.findMany({ where: { id: { in: ids }, provider: "cloudinary" }, select: { id: true } });
  if (found.length !== ids.length) throw new ApiError(400, "INVALID_MEDIA", "One or more selected screenshots are unavailable.");
}

export async function listCaseStudies(db, query) {
  const status = parseEnumFilter(query.filters.status, ["DRAFT", "PUBLISHED"], "status");
  const projectId = query.filters.projectId;
  const where = {
    ...whereSearch(query, ["slug", "problem", "businessContext", "role", "approach"]),
    ...(status ? { status } : {}),
    ...(projectId ? { projectId } : {}),
    ...(query.q ? { OR: [...whereSearch(query, ["slug", "problem", "businessContext", "role", "approach"]).OR, { project: { title: { contains: query.q, mode: "insensitive" } } }] } : {}),
  };
  if (projectId && !/^[A-Za-z0-9_-]{1,128}$/.test(projectId)) throw new ApiError(400, "INVALID_QUERY", "The projectId filter is invalid.");
  const [data, total] = await Promise.all([
    db.caseStudy.findMany({ where, include, orderBy: [{ updatedAt: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    db.caseStudy.count({ where }),
  ]);
  return paginated(data, total, query.page, query.pageSize);
}

export async function getCaseStudy(db, id) {
  const item = await db.caseStudy.findUnique({ where: { id }, include });
  if (!item) throw new ApiError(404, "NOT_FOUND", "The requested case study was not found.");
  return item;
}

export async function createCaseStudy(db, input) {
  const validated = validationData(caseStudyCreateSchema, input);
  const data = publishedData(validated);
  return inTransaction(db, async (tx) => {
    const { mediaAssetIds, ...fields } = data;
    const project = await tx.project.findUnique({ where: { id: fields.projectId }, select: { id: true } });
    if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", "The selected project was not found.");
    await verifyMediaAssets(tx, mediaAssetIds);
    try {
      return await tx.caseStudy.create({ data: { ...fields, ...(mediaAssetIds !== undefined ? { screenshots: { create: mediaAssetIds.map((mediaAssetId, sortOrder) => ({ sortOrder, mediaAsset: { connect: { id: mediaAssetId } } })) } } : {}) }, include });
    } catch (error) {
      if (error?.code === "P2002") throw new ApiError(409, "CASE_STUDY_EXISTS", "This project already has a case study, or the slug is already in use.");
      if (error?.code === "P2003") throw new ApiError(404, "PROJECT_NOT_FOUND", "The selected project was not found.");
      throw error;
    }
  });
}

export async function updateCaseStudy(db, id, input) {
  const validated = validationData(caseStudyPatchSchema, input);
  return inTransaction(db, async (tx) => {
    const current = await tx.caseStudy.findUnique({ where: { id }, select: { status: true, publishedAt: true } });
    if (!current) throw new ApiError(404, "NOT_FOUND", "The requested case study was not found.");
    if (validated.projectId) {
      const project = await tx.project.findUnique({ where: { id: validated.projectId }, select: { id: true } });
      if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", "The selected project was not found.");
    }
    const data = publishedData(validated, current);
    const { mediaAssetIds, ...fields } = data;
    await verifyMediaAssets(tx, mediaAssetIds);
    try {
      return await tx.caseStudy.update({ where: { id }, data: { ...fields, ...(mediaAssetIds !== undefined ? { screenshots: { deleteMany: {}, create: mediaAssetIds.map((mediaAssetId, sortOrder) => ({ sortOrder, mediaAsset: { connect: { id: mediaAssetId } } })) } } : {}) }, include });
    } catch (error) {
      if (error?.code === "P2002") throw new ApiError(409, "CASE_STUDY_EXISTS", "This project already has a case study, or the slug is already in use.");
      if (error?.code === "P2003") throw new ApiError(404, "PROJECT_NOT_FOUND", "The selected project was not found.");
      throw error;
    }
  });
}

export async function deleteCaseStudy(db, id) {
  try {
    await db.caseStudy.delete({ where: { id } });
  } catch (error) {
    if (error?.code === "P2025") throw new ApiError(404, "NOT_FOUND", "The requested case study was not found.");
    throw error;
  }
  return { deleted: true, id };
}
