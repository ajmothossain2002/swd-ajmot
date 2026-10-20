import ExcelJS from "exceljs";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  caseStudyCreateSchema,
  caseStudyPatchSchema,
  postCreateSchema,
  postPatchSchema,
  projectCreateSchema,
  projectPatchSchema,
} from "./validation.mjs";
import { publishedData, resolveTags, verifyCoverImage } from "./content-common.mjs";

const MAX_ROWS_PER_SHEET = 500;
const bulkImportLockKey = BigInt("2438910271728226009");

const columns = {
  Projects: ["id", "slug", "title", "summary", "category", "status", "visibility", "featured", "sortOrder", "tags", "coverImageId"],
  CaseStudies: ["id", "projectSlug", "slug", "status", "publishedAt", "problem", "businessContext", "role", "approach", "capabilities", "capabilityLabel", "challengesJson", "architectureNote", "technologies", "evidence", "publicLinksJson", "mediaAssetIds"],
  BlogPosts: ["id", "slug", "title", "description", "category", "markdown", "status", "publishedAt", "tags", "coverImageId"],
} as const;
const legacyColumns: Partial<Record<SheetName, readonly (readonly string[])[]>> = {
  Projects: [
    ["id", "slug", "title", "summary", "category", "projectStatus", "visibility", "featured", "sortOrder", "tags", "coverImageAssetId"],
    ["id", "slug", "title", "summary", "category", "projectStatus", "visibility", "featured", "sortOrder", "tagsJson", "coverImageAssetId"],
  ],
  CaseStudies: [
    ["id", "projectSlug", "slug", "publicationStatus", "publishedAt", "problem", "businessContext", "role", "approach", "capabilities", "capabilityLabel", "challengesJson", "architectureNote", "technologies", "evidence", "publicLinksJson", "mediaAssetIds"],
    ["id", "projectSlug", "slug", "publicationStatus", "publishedAt", "problem", "businessContext", "role", "approach", "capabilitiesJson", "capabilityLabel", "challengesJson", "architectureNote", "technologiesJson", "evidenceJson", "publicLinksJson", "mediaAssetIdsJson"],
  ],
  BlogPosts: [
    ["id", "slug", "title", "description", "category", "markdown", "publicationStatus", "publishedAt", "tags", "coverImageAssetId"],
    ["id", "slug", "title", "description", "category", "markdown", "publicationStatus", "publishedAt", "tagsJson", "coverImageAssetId"],
  ],
};

type SheetName = keyof typeof columns;
export type ContentCollection = "projects" | "caseStudies" | "blogPosts";
type RowIssue = { sheet: string; row: number; message: string };
type ParsedRow = { id?: string; row: number; data: Record<string, unknown> };
type ParsedWorkbook = Record<SheetName, ParsedRow[]>;

export class WorkbookImportError extends Error {
  readonly issues: RowIssue[];

  constructor(issues: RowIssue[]) {
    super("The workbook contains invalid rows.");
    this.name = "WorkbookImportError";
    this.issues = issues;
  }
}

const jsonFields: Record<SheetName, Record<string, string>> = {
  Projects: {},
  CaseStudies: {
    challengesJson: "challenges",
    publicLinksJson: "publicLinks",
  },
  BlogPosts: {},
};

const plainListFields: Record<SheetName, Set<string>> = {
  Projects: new Set(["tags"]),
  CaseStudies: new Set(["capabilities", "technologies", "evidence", "mediaAssetIds"]),
  BlogPosts: new Set(["tags"]),
};

const jsonAllowedFields: Record<SheetName, Set<string>> = {
  Projects: new Set(["id", "slug", "title", "summary", "category", "status", "visibility", "featured", "sortOrder", "coverImageId", "tags"]),
  CaseStudies: new Set(["id", "projectSlug", "slug", "status", "publishedAt", "problem", "businessContext", "role", "approach", "capabilities", "capabilityLabel", "challenges", "architectureNote", "technologies", "evidence", "publicLinks", "mediaAssetIds"]),
  BlogPosts: new Set(["id", "slug", "title", "description", "category", "markdown", "status", "publishedAt", "coverImageId", "tags"]),
};

function cellString(value: unknown, jsonField: boolean, plainListField = false) {
  if (value === null || value === undefined) return "";
  if (plainListField && Array.isArray(value)) return value.map((item) => String(item)).join("\n");
  return jsonField ? JSON.stringify(value) : typeof value === "string" ? value : String(value);
}

function generatedSlug(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export async function normalizeCmsJson(buffer: Buffer, onlyCollection: ContentCollection): Promise<Buffer> {
  let document: unknown;
  try {
    document = JSON.parse(buffer.toString("utf8"));
  } catch {
    throw new WorkbookImportError([{ sheet: "JSON", row: 0, message: "This is not valid JSON." }]);
  }

  if (!document || typeof document !== "object" || Array.isArray(document) || !("collections" in document)) {
    throw new WorkbookImportError([{ sheet: "JSON", row: 0, message: "Expected a CMS content pack with a collections object." }]);
  }
  const collections = (document as { collections?: unknown }).collections;
  if (!collections || typeof collections !== "object" || Array.isArray(collections)) {
    throw new WorkbookImportError([{ sheet: "JSON", row: 0, message: "The collections value must be an object." }]);
  }
  const collectionRecord = collections as Record<string, unknown>;
  const validNames = new Set(["projects", "caseStudies", "blogPosts"]);
  const unknown = Object.keys(collectionRecord).find((name) => !validNames.has(name));
  if (unknown) throw new WorkbookImportError([{ sheet: "JSON", row: 0, message: `Unsupported collection: ${unknown}.` }]);

  const workbook = new ExcelJS.Workbook();
  for (const [sheetName, collectionName] of [["Projects", "projects"], ["CaseStudies", "caseStudies"], ["BlogPosts", "blogPosts"]] as const) {
    if (collectionName !== onlyCollection) continue;
    const sheet = workbookSheet(workbook, sheetName, columns[sheetName]);
    const records = collectionRecord[collectionName] ?? [];
    if (!Array.isArray(records)) throw new WorkbookImportError([{ sheet: sheetName, row: 0, message: `collections.${collectionName} must be an array.` }]);
    if (records.length > MAX_ROWS_PER_SHEET) throw new WorkbookImportError([{ sheet: sheetName, row: 0, message: `This collection exceeds the ${MAX_ROWS_PER_SHEET}-row limit.` }]);

    records.forEach((record, index) => {
      const rowNumber = index + 2;
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new WorkbookImportError([{ sheet: sheetName, row: rowNumber, message: "Each collection item must be an object." }]);
      }
      const values = record as Record<string, unknown>;
      const unexpected = Object.keys(values).find((key) => !jsonAllowedFields[sheetName].has(key));
      if (unexpected) throw new WorkbookImportError([{ sheet: sheetName, row: rowNumber, message: `Unsupported field: ${unexpected}.` }]);
      const remap = jsonFields[sheetName];
      sheet.addRow(columns[sheetName].map((column) => {
        const sourceKey = remap[column] ?? column;
        return cellString(values[sourceKey], column.endsWith("Json"), plainListFields[sheetName].has(column));
      }));
    });
  }
  addInstructions(workbook, onlyCollection);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function createCmsJson(db: PrismaClient, collection: ContentCollection) {
  const projects = collection === "projects" ? await db.project.findMany({ include: { tags: { orderBy: { name: "asc" } } }, orderBy: [{ sortOrder: "asc" }, { slug: "asc" }] }) : [];
  const caseStudies = collection === "caseStudies" ? await db.caseStudy.findMany({ include: { project: { select: { slug: true } }, screenshots: { orderBy: { sortOrder: "asc" }, select: { mediaAssetId: true } } }, orderBy: [{ slug: "asc" }] }) : [];
  const posts = collection === "blogPosts" ? await db.blogPost.findMany({ include: { tags: { orderBy: { name: "asc" } } }, orderBy: [{ slug: "asc" }] }) : [];
  return {
    packageName: "Ajmot Hossain Portfolio CMS Bulk Content Pack",
    packageVersion: "1.0",
    collections: {
      projects: projects.map((item) => ({ id: item.id, slug: item.slug, title: item.title, summary: item.summary, category: item.category, status: item.status, visibility: item.visibility, featured: item.featured, sortOrder: item.sortOrder, coverImageId: item.coverImageId, tags: item.tags.map((tag) => tag.name) })),
      caseStudies: caseStudies.map((item) => ({ id: item.id, projectSlug: item.project.slug, slug: item.slug, status: item.status, publishedAt: item.publishedAt?.toISOString() ?? null, problem: item.problem, businessContext: item.businessContext, role: item.role, approach: item.approach, capabilities: item.capabilities, capabilityLabel: item.capabilityLabel, challenges: item.challenges, architectureNote: item.architectureNote, technologies: item.technologies, evidence: item.evidence, publicLinks: item.publicLinks, mediaAssetIds: item.screenshots.map((image) => image.mediaAssetId) })),
      blogPosts: posts.map((item) => ({ id: item.id, slug: item.slug, title: item.title, description: item.description, category: item.category, markdown: item.markdown, status: item.status, publishedAt: item.publishedAt?.toISOString() ?? null, coverImageId: item.coverImageId, tags: item.tags.map((tag) => tag.name) })),
    },
    importNotes: [
      "Content data only; importing does not change admin accounts, authentication, or schema migrations.",
      "Keep each record id to update it. Remove the id only when intentionally creating a new record with a new slug.",
      "Case studies link to projects using projectSlug. Rows omitted from a pack are not deleted.",
      "All records are validated and committed in one transaction; one invalid row cancels the batch.",
    ],
    counts: { projects: projects.length, caseStudies: caseStudies.length, blogPosts: posts.length },
  };
}

function jsonCell(value: unknown) {
  return JSON.stringify(value ?? []);
}

function workbookSheet(workbook: ExcelJS.Workbook, name: string, headers: readonly string[]) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = headers.map((header) => ({ header, key: header, width: Math.min(42, Math.max(16, header.length + 4)) }));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF292524" } };
  return sheet;
}

function addInstructions(workbook: ExcelJS.Workbook, collection: ContentCollection) {
  const sheet = workbook.addWorksheet("Instructions");
  sheet.columns = [{ width: 28 }, { width: 110 }];
  const fieldNotes: Record<ContentCollection, Array<[string, string]>> = {
    projects: [
      ["id", "Leave blank to create a project; copied IDs from an export update the matching record."],
      ["slug", "Optional URL key. Leave blank to generate it from title. Must be unique."],
      ["title / summary", "Project card title and overview text shown on the public site."],
      ["category / status", "Category label and descriptive project status, such as In progress."],
      ["visibility", "Use PUBLIC or PRIVATE. Only PUBLIC projects appear on the public site."],
      ["featured / sortOrder", "Use TRUE/FALSE for featured. Lower sortOrder values appear first."],
      ["tags", "Optional tag names, one per line."],
      ["coverImageId", "Optional ID from an existing CMS media asset. Do not enter an image URL."],
    ],
    caseStudies: [
      ["id", "Leave blank to create; copied IDs from an export update the matching case study."],
      ["projectSlug", "Required existing project slug. Import the project before its case study."],
      ["slug", "Optional URL key. Leave blank to generate it from projectSlug."],
      ["status / publishedAt", "Use DRAFT or PUBLISHED. Use an ISO timestamp for publishedAt; drafts should leave it blank."],
      ["capabilities / technologies / evidence", "Enter one item per line."],
      ["challengesJson / publicLinksJson", "Enter valid JSON arrays; public links require approved HTTPS URLs."],
      ["mediaAssetIds", "Existing CMS media IDs, one per line. These are not image URLs."],
    ],
    blogPosts: [
      ["id", "Leave blank to create; copied IDs from an export update the matching post."],
      ["slug", "Optional URL key. Leave blank to generate it from title."],
      ["title / description / markdown", "Article title, excerpt, and full Markdown body."],
      ["category / status", "Use DRAFT or PUBLISHED for status."],
      ["publishedAt", "Use an ISO timestamp for published posts; drafts should leave it blank."],
      ["tags", "Optional tag names, one per line."],
      ["coverImageId", "Optional ID from an existing CMS media asset. Do not enter an image URL."],
    ],
  };
  sheet.addRows([
    ["Portfolio CMS workbook", `This file is for ${collection}. The matching content sheet opens first.`],
    ["Import behavior", "Leave id blank for a new record; the database generates it. Keep an exported id only when updating that record. Omitted records are never deleted."],
    ...fieldNotes[collection],
    ["Safety", "The entire import is validated and committed as one database transaction. Any invalid row cancels the full import."],
    ["Dates", "Use an ISO date/time with timezone, such as 2026-10-20T12:00:00.000Z. Leave blank for drafts."],
    ["Import order", "Import projects first, then their case studies, then blog posts. This screen imports only one collection."],
    ["Limits", `Maximum ${MAX_ROWS_PER_SHEET} data rows per sheet. Do not add formulas; formula cells are rejected.`],
  ]);
  sheet.getColumn(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

export async function createCmsWorkbook(db: PrismaClient, collection: ContentCollection, template = false): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ajmot Hossain Portfolio CMS";
  workbook.created = new Date();
  const selectedSheet: SheetName = collection === "projects" ? "Projects" : collection === "caseStudies" ? "CaseStudies" : "BlogPosts";
  const contentSheet = workbookSheet(workbook, selectedSheet, columns[selectedSheet]);
  addInstructions(workbook, collection);

  if (!template && collection === "projects") {
    const projects = await db.project.findMany({ include: { tags: { orderBy: { name: "asc" } } }, orderBy: [{ sortOrder: "asc" }, { slug: "asc" }] });
    for (const item of projects) contentSheet.addRow({
      id: item.id,
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      category: item.category,
      status: item.status,
      visibility: item.visibility,
      featured: item.featured,
      sortOrder: item.sortOrder,
      tags: item.tags.map((tag: { name: string }) => tag.name).join("\n"),
      coverImageId: item.coverImageId ?? "",
    });
  } else if (!template && collection === "caseStudies") {
    const caseStudies = await db.caseStudy.findMany({
        include: { project: { select: { slug: true } }, screenshots: { orderBy: { sortOrder: "asc" }, select: { mediaAssetId: true } } },
        orderBy: [{ slug: "asc" }],
    });
    for (const item of caseStudies) contentSheet.addRow({
      id: item.id,
      projectSlug: item.project.slug,
      slug: item.slug,
      status: item.status,
      publishedAt: item.publishedAt?.toISOString() ?? "",
      problem: item.problem ?? "",
      businessContext: item.businessContext ?? "",
      role: item.role ?? "",
      approach: item.approach ?? "",
      capabilities: item.capabilities.join("\n"),
      capabilityLabel: item.capabilityLabel ?? "",
      challengesJson: jsonCell(item.challenges),
      architectureNote: item.architectureNote ?? "",
      technologies: item.technologies.join("\n"),
      evidence: item.evidence.join("\n"),
      publicLinksJson: jsonCell(item.publicLinks),
      mediaAssetIds: item.screenshots.map((image: { mediaAssetId: string }) => image.mediaAssetId).join("\n"),
    });

  } else if (!template && collection === "blogPosts") {
    const posts = await db.blogPost.findMany({ include: { tags: { orderBy: { name: "asc" } } }, orderBy: [{ slug: "asc" }] });
    for (const item of posts) contentSheet.addRow({
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      category: item.category,
      markdown: item.markdown,
      status: item.status,
      publishedAt: item.publishedAt?.toISOString() ?? "",
      tags: item.tags.map((tag: { name: string }) => tag.name).join("\n"),
      coverImageId: item.coverImageId ?? "",
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function readCell(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  throw new Error("Formula, rich text, hyperlink, and other special cells are not supported.");
}

function parseJsonArray(value: string, sheet: string, row: number, field: string, issues: RowIssue[]) {
  if (!value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Report below using a consistent row-level error.
  }
  issues.push({ sheet, row, message: `${field} must be a valid JSON array.` });
  return [];
}

function parseList(value: string, sheet: string, row: number, field: string, issues: RowIssue[]) {
  if (!value.trim()) return [];
  if (value.trimStart().startsWith("[")) return parseJsonArray(value, sheet, row, field, issues);
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function parseBoolean(value: string, sheet: string, row: number, field: string, issues: RowIssue[]) {
  if (value.toLowerCase() === "true" || value === "1") return true;
  if (value.toLowerCase() === "false" || value === "0") return false;
  issues.push({ sheet, row, message: `${field} must be TRUE or FALSE.` });
  return false;
}

function parseNumber(value: string, sheet: string, row: number, field: string, issues: RowIssue[]) {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  if (Number.isInteger(parsed)) return parsed;
  issues.push({ sheet, row, message: `${field} must be a whole number.` });
  return 0;
}

function validateRow(schema: { safeParse(value: unknown): { success: boolean; data?: unknown; error?: { issues: Array<{ path: (string | number)[]; message: string }> } } }, value: unknown, sheet: string, row: number, issues: RowIssue[]) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const messages = parsed.error?.issues.slice(0, 4).map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`) ?? [];
    issues.push({ sheet, row, message: messages.join("; ") || "One or more fields are invalid." });
    return undefined;
  }
  return parsed.data as Record<string, unknown>;
}

function parseSheet(workbook: ExcelJS.Workbook, name: SheetName, issues: RowIssue[], includeRows: boolean): ParsedRow[] {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) {
    issues.push({ sheet: name, row: 1, message: "Required worksheet is missing." });
    return [];
  }
  if (includeRows && sheet.rowCount > MAX_ROWS_PER_SHEET + 1) {
    issues.push({ sheet: name, row: MAX_ROWS_PER_SHEET + 2, message: `This sheet exceeds the ${MAX_ROWS_PER_SHEET}-row limit.` });
    return [];
  }

  const headers = columns[name];
  const headerRow = sheet.getRow(1);
  const actualHeaders = headers.map((_, index) => readCell(headerRow.getCell(index + 1).value).trim());
  const isCurrentTemplate = headerRow.cellCount === headers.length && actualHeaders.every((header, index) => header === headers[index]);
  const oldHeaders = legacyColumns[name] ?? [];
  const isLegacyTemplate = oldHeaders.some((candidate) => headerRow.cellCount === candidate.length && actualHeaders.every((header, index) => header === candidate[index]));
  if (!isCurrentTemplate && !isLegacyTemplate) {
    issues.push({ sheet: name, row: 1, message: "Column names or order do not match the CMS workbook template." });
    return [];
  }
  if (!includeRows) return [];

  const result: ParsedRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    let values: string[];
    try {
      values = headers.map((_, index) => readCell(row.getCell(index + 1).value));
    } catch (error) {
      issues.push({ sheet: name, row: rowNumber, message: error instanceof Error ? error.message : "Unsupported cell value." });
      continue;
    }
    if (values.every((value) => !value.trim())) continue;
    result.push({ id: values[0]?.trim() || undefined, row: rowNumber, data: Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) });
  }
  return result;
}

function assertUniqueRows(rows: ParsedRow[], sheet: SheetName, issues: RowIssue[]) {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const row of rows) {
    const id = row.id;
    const slugField = sheet === "CaseStudies" ? "slug" : "slug";
    const slug = String(row.data[slugField] ?? "").trim();
    if (id && ids.has(id)) issues.push({ sheet, row: row.row, message: "The same id appears more than once in this worksheet." });
    if (slug && slugs.has(slug)) issues.push({ sheet, row: row.row, message: "The same slug appears more than once in this worksheet." });
    if (id) ids.add(id);
    if (slug) slugs.add(slug);
  }
}

export async function inspectCmsWorkbook(buffer: Buffer, collection: ContentCollection) {
  const workbook = new ExcelJS.Workbook();
  try {
    const loadBuffer = Buffer.from(buffer);
    await workbook.xlsx.load(loadBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    return { issues: [{ sheet: "Workbook", row: 0, message: "This is not a readable .xlsx workbook." }], counts: { projects: 0, caseStudies: 0, blogPosts: 0 } };
  }

  const allowedSheets = new Set(["Instructions", ...Object.keys(columns)]);
  const unknownSheet = workbook.worksheets.find((sheet) => !allowedSheets.has(sheet.name));
  const issues: RowIssue[] = [];
  if (unknownSheet) issues.push({ sheet: unknownSheet.name, row: 1, message: "Unexpected worksheet. Use the supplied CMS workbook sheets." });
  const activeSheet: SheetName = collection === "projects" ? "Projects" : collection === "caseStudies" ? "CaseStudies" : "BlogPosts";
  const parsed: ParsedWorkbook = {
    Projects: activeSheet === "Projects" ? parseSheet(workbook, "Projects", issues, true) : [],
    CaseStudies: activeSheet === "CaseStudies" ? parseSheet(workbook, "CaseStudies", issues, true) : [],
    BlogPosts: activeSheet === "BlogPosts" ? parseSheet(workbook, "BlogPosts", issues, true) : [],
  };

  for (const sheet of Object.keys(parsed) as SheetName[]) {
    assertUniqueRows(parsed[sheet], sheet, issues);
    for (const row of parsed[sheet]) {
      const value = row.data;
      let data: Record<string, unknown> | undefined;
      if (sheet === "Projects") {
        data = validateRow(row.id ? projectPatchSchema : projectCreateSchema, {
          slug: String(value.slug).trim() || generatedSlug(String(value.title)),
          title: value.title,
          summary: value.summary,
          category: value.category,
          status: value.status,
          visibility: String(value.visibility).toUpperCase(),
          featured: parseBoolean(String(value.featured), sheet, row.row, "featured", issues),
          sortOrder: parseNumber(String(value.sortOrder), sheet, row.row, "sortOrder", issues),
          tags: parseList(String(value.tags), sheet, row.row, "tags", issues),
          coverImageId: String(value.coverImageId).trim() || null,
        }, sheet, row.row, issues);
      } else if (sheet === "BlogPosts") {
        data = validateRow(row.id ? postPatchSchema : postCreateSchema, {
          slug: String(value.slug).trim() || generatedSlug(String(value.title)),
          title: value.title,
          description: value.description,
          markdown: value.markdown,
          category: value.category,
          status: String(value.status).toUpperCase(),
          publishedAt: String(value.publishedAt).trim() || null,
          tags: parseList(String(value.tags), sheet, row.row, "tags", issues),
          coverImageId: String(value.coverImageId).trim() || null,
        }, sheet, row.row, issues);
      } else {
        if (!String(value.projectSlug).trim()) issues.push({ sheet, row: row.row, message: "projectSlug is required." });
        data = validateRow(row.id ? caseStudyPatchSchema : caseStudyCreateSchema, {
          projectId: "pending-project-id",
          slug: String(value.slug).trim() || generatedSlug(String(value.projectSlug)),
          status: String(value.status).toUpperCase(),
          publishedAt: String(value.publishedAt).trim() || null,
          problem: String(value.problem).trim() || null,
          businessContext: String(value.businessContext).trim() || null,
          role: String(value.role).trim() || null,
          approach: String(value.approach).trim() || null,
          capabilities: parseList(String(value.capabilities), sheet, row.row, "capabilities", issues),
          capabilityLabel: String(value.capabilityLabel).trim() || null,
          challenges: parseJsonArray(String(value.challengesJson), sheet, row.row, "challengesJson", issues),
          architectureNote: String(value.architectureNote).trim() || null,
          technologies: parseList(String(value.technologies), sheet, row.row, "technologies", issues),
          evidence: parseList(String(value.evidence), sheet, row.row, "evidence", issues),
          publicLinks: parseJsonArray(String(value.publicLinksJson), sheet, row.row, "publicLinksJson", issues),
          mediaAssetIds: parseList(String(value.mediaAssetIds), sheet, row.row, "mediaAssetIds", issues),
        }, sheet, row.row, issues);
      }
      if (data) row.data = { ...row.data, ...data };
    }
  }

  if (parsed.Projects.length + parsed.CaseStudies.length + parsed.BlogPosts.length === 0) {
    issues.push({ sheet: "Workbook", row: 0, message: "The workbook contains no content rows." });
  }
  return {
    parsed,
    issues: issues.slice(0, 100),
    counts: { projects: parsed.Projects.length, caseStudies: parsed.CaseStudies.length, blogPosts: parsed.BlogPosts.length },
  };
}

function failRow(sheet: string, row: number, message: string): never {
  throw new WorkbookImportError([{ sheet, row, message }]);
}

function databaseErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error && error.name === "ApiError") return error.message;
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (code === "P2002") return "A slug or relationship conflicts with an existing CMS record. Export the latest workbook and check the IDs and slugs.";
  if (code === "P2003") return "A related project or media asset does not exist.";
  if (code === "P2000") return "A value exceeds the database column limit. Shorten the value and try again.";
  // Only known row/data conflicts should be reported as validation errors. An
  // unknown Prisma/database error must reach the route so it can return 503.
  return undefined;
}

function failDatabaseRow(sheet: string, row: number, error: unknown): never {
  const message = databaseErrorMessage(error);
  if (message) failRow(sheet, row, message);
  throw error;
}

export async function importCmsWorkbook(db: PrismaClient, buffer: Buffer, collection: ContentCollection) {
  const inspected = await inspectCmsWorkbook(buffer, collection);
  if (inspected.issues.length || !inspected.parsed) throw new WorkbookImportError(inspected.issues);
  const parsed = inspected.parsed;

  // The sheet parser returns generic record values; schema validation narrows them before writes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.$transaction(async (tx: any) => {
    // Return an integer result to Prisma while still acquiring the transaction lock.
    await tx.$queryRaw`WITH acquired AS MATERIALIZED (SELECT pg_advisory_xact_lock(${bulkImportLockKey})) SELECT 1::int AS locked FROM acquired`;
    const totals = { projectsCreated: 0, projectsUpdated: 0, caseStudiesCreated: 0, caseStudiesUpdated: 0, blogPostsCreated: 0, blogPostsUpdated: 0 };

    for (const row of parsed.Projects) {
      const d = row.data;
      try {
        const current = row.id ? await tx.project.findUnique({ where: { id: row.id }, select: { id: true, slug: true } }) : null;
        if (row.id && !current) failRow("Projects", row.row, "This id no longer exists. Export a fresh workbook before importing updates.");
        if (!row.id && await tx.project.findUnique({ where: { slug: d.slug }, select: { id: true } })) failRow("Projects", row.row, "This slug already exists. Include its id from the latest export to update it.");
        const slug = String(d.slug);
        if (current && current.slug !== slug) {
          const redirect = await tx.projectSlugRedirect.findUnique({ where: { oldSlug: slug }, select: { projectId: true } });
          if (redirect && redirect.projectId !== current.id) failRow("Projects", row.row, "This slug is reserved by another project's URL redirect.");
        }
        await verifyCoverImage(tx, d.coverImageId as string | null | undefined);
        const tags = await resolveTags(tx, d.tags as string[] | undefined);
        const fields = { ...d };
        // The sheet's id is only an update selector. In particular, a blank
        // spreadsheet cell becomes "" and would bypass Prisma's cuid default,
        // making the first insert use an empty primary key and every later
        // insert fail with a duplicate-key error.
        delete fields.id;
        delete fields.tags;
        const coverImageId = fields.coverImageId;
        delete fields.coverImageId;
        const saved = current
          ? await tx.project.update({ where: { id: current.id }, data: { ...fields, coverImageId, tags: { set: tags } }, select: { id: true, slug: true } })
          : await tx.project.create({ data: { ...fields, coverImageId, tags: { connect: tags } }, select: { id: true, slug: true } });
        if (current && current.slug !== saved.slug) {
          await tx.projectSlugRedirect.upsert({ where: { oldSlug: current.slug }, create: { oldSlug: current.slug, projectId: current.id }, update: { projectId: current.id } });
        }
        totals[current ? "projectsUpdated" : "projectsCreated"] += 1;
      } catch (error) {
        if (error instanceof WorkbookImportError) throw error;
        failDatabaseRow("Projects", row.row, error);
      }
    }

    for (const row of parsed.BlogPosts) {
      const d = publishedData(row.data);
      try {
        const current = row.id ? await tx.blogPost.findUnique({ where: { id: row.id }, select: { id: true, slug: true, status: true, publishedAt: true } }) : null;
        if (row.id && !current) failRow("BlogPosts", row.row, "This id no longer exists. Export a fresh workbook before importing updates.");
        if (!row.id && await tx.blogPost.findUnique({ where: { slug: d.slug }, select: { id: true } })) failRow("BlogPosts", row.row, "This slug already exists. Include its id from the latest export to update it.");
        if (current && current.slug !== d.slug) {
          const redirect = await tx.blogPostSlugRedirect.findUnique({ where: { oldSlug: d.slug }, select: { blogPostId: true } });
          if (redirect && redirect.blogPostId !== current.id) failRow("BlogPosts", row.row, "This slug is reserved by another article's URL redirect.");
        }
        await verifyCoverImage(tx, d.coverImageId as string | null | undefined);
        const tags = await resolveTags(tx, d.tags as string[] | undefined);
        const fields = { ...d };
        delete fields.id;
        delete fields.tags;
        const coverImageId = fields.coverImageId;
        delete fields.coverImageId;
        const saved = current
          ? await tx.blogPost.update({ where: { id: current.id }, data: { ...fields, coverImageId, tags: { set: tags } }, select: { id: true, slug: true } })
          : await tx.blogPost.create({ data: { ...fields, coverImageId, tags: { connect: tags } }, select: { id: true, slug: true } });
        if (current && current.slug !== saved.slug) {
          await tx.blogPostSlugRedirect.upsert({ where: { oldSlug: current.slug }, create: { oldSlug: current.slug, blogPostId: current.id }, update: { blogPostId: current.id } });
        }
        totals[current ? "blogPostsUpdated" : "blogPostsCreated"] += 1;
      } catch (error) {
        if (error instanceof WorkbookImportError) throw error;
        failDatabaseRow("BlogPosts", row.row, error);
      }
    }

    for (const row of parsed.CaseStudies) {
      const project = await tx.project.findUnique({ where: { slug: row.data.projectSlug }, select: { id: true } });
      if (!project) failRow("CaseStudies", row.row, "projectSlug does not match a project in the database or Projects sheet.");
      const d = publishedData({ ...row.data, projectId: project.id });
      try {
        const current = row.id ? await tx.caseStudy.findUnique({ where: { id: row.id }, select: { id: true, status: true, publishedAt: true } }) : null;
        if (row.id && !current) failRow("CaseStudies", row.row, "This id no longer exists. Export a fresh workbook before importing updates.");
        if (!row.id && await tx.caseStudy.findFirst({ where: { OR: [{ projectId: project.id }, { slug: d.slug }] }, select: { id: true } })) failRow("CaseStudies", row.row, "A case study already exists for this project or slug. Include its id from the latest export to update it.");
        const mediaAssetIds = d.mediaAssetIds as string[];
        const validAssets = await tx.mediaAsset.findMany({ where: { id: { in: mediaAssetIds }, provider: "cloudinary" }, select: { id: true } });
        if (validAssets.length !== mediaAssetIds.length) failRow("CaseStudies", row.row, "One or more media asset IDs do not exist in the CMS media library.");
        const fields = { ...d };
        delete fields.id;
        delete fields.mediaAssetIds;
        if (current) {
          await tx.caseStudy.update({
            where: { id: current.id },
            data: { ...fields, screenshots: { deleteMany: {}, create: mediaAssetIds.map((mediaAssetId, sortOrder) => ({ mediaAssetId, sortOrder })) } },
          });
        } else {
          await tx.caseStudy.create({
            data: { ...fields, screenshots: { create: mediaAssetIds.map((mediaAssetId, sortOrder) => ({ mediaAssetId, sortOrder })) } },
          });
        }
        totals[current ? "caseStudiesUpdated" : "caseStudiesCreated"] += 1;
      } catch (error) {
        if (error instanceof WorkbookImportError) throw error;
        failDatabaseRow("CaseStudies", row.row, error);
      }
    }

    return totals;
  }, { maxWait: 10_000, timeout: 120_000 });
}
