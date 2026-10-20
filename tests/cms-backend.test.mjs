import test from "node:test";
import assert from "node:assert/strict";
import { createCollectionHandlers, createItemHandlers } from "../src/lib/cms/http.mjs";
import { listProjects, getProject, createProject, updateProject, deleteProject } from "../src/lib/cms/projects.mjs";
import { listPosts, getPost, createPost, updatePost, deletePost } from "../src/lib/cms/posts.mjs";
import { listCaseStudies, getCaseStudy, createCaseStudy, updateCaseStudy, deleteCaseStudy } from "../src/lib/cms/case-studies.mjs";
import { ApiError, caseStudyCreateSchema, errorResponse, parseListQuery, postCreateSchema, projectCreateSchema, readJson, validationData } from "../src/lib/cms/validation.mjs";

class MemoryCms {
  projects = [];
  blogPosts = [];
  caseStudies = [];
  mediaAssets = [];
  tags = [];
  projectSlugRedirects = [];
  blogPostSlugRedirects = [];
  nextId = 0;

  constructor() {
    this.$transaction = (callback) => callback(this);
    this.tag = {
      upsert: async ({ where, create }) => {
        let tag = this.tags.find((item) => item.slug === where.slug);
        if (!tag) {
          tag = { id: this.id(), ...create };
          this.tags.push(tag);
        }
        return { id: tag.id };
      },
    };
    this.projectSlugRedirect = this.redirectModel("projectSlugRedirects", "projectId");
    this.blogPostSlugRedirect = this.redirectModel("blogPostSlugRedirects", "blogPostId");
    this.mediaAsset = { findUnique: async ({ where }) => this.mediaAssets.find((item) => item.id === where.id) ?? null };
    this.project = this.model("projects", (row, where) => row.id === where.id || row.slug === where.slug, (data) => ({
      ...data,
      id: this.id(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: data.tags?.connect?.map(({ id }) => this.tags.find((tag) => tag.id === id)) ?? [],
      coverImage: null,
    }));
    this.blogPost = this.model("blogPosts", (row, where) => row.id === where.id || row.slug === where.slug, (data) => ({
      ...data,
      id: this.id(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: data.tags?.connect?.map(({ id }) => this.tags.find((tag) => tag.id === id)) ?? [],
      coverImage: null,
    }));
    this.caseStudy = this.model("caseStudies", (row, where) => row.id === where.id || row.projectId === where.projectId || row.slug === where.slug, (data) => ({
      ...data,
      id: this.id(),
      createdAt: new Date(),
      updatedAt: new Date(),
      project: this.projects.find((project) => project.id === data.projectId),
    }));
  }

  id() { this.nextId += 1; return `id_${this.nextId}`; }

  redirectModel(collection, ownerKey) {
    const rows = this[collection];
    return {
      findUnique: async ({ where }) => rows.find((row) => row.oldSlug === where.oldSlug) ?? null,
      upsert: async ({ where, create, update }) => {
        let row = rows.find((item) => item.oldSlug === where.oldSlug);
        if (row) Object.assign(row, update);
        else { row = create; rows.push(row); }
        return row[ownerKey];
      },
    };
  }

  model(collection, matches, build) {
    const rows = this[collection];
    return {
      findUnique: async ({ where }) => rows.find((row) => matches(row, where)) ?? null,
      findMany: async ({ where, skip = 0, take = 20, orderBy }) => {
        let found = rows.filter((row) => this.matchesWhere(row, where));
        if (orderBy?.[0]?.sortOrder) found = found.sort((a, b) => a.sortOrder - b.sortOrder);
        return found.slice(skip, skip + take);
      },
      count: async ({ where }) => rows.filter((row) => this.matchesWhere(row, where)).length,
      create: async ({ data }) => {
        if (rows.some((row) => row.slug === data.slug)) throw Object.assign(new Error("private database detail"), { code: "P2002" });
        if (collection === "caseStudies" && (rows.some((row) => row.projectId === data.projectId) || !this.projects.some((row) => row.id === data.projectId))) {
          throw Object.assign(new Error("private relation detail"), { code: "P2002" });
        }
        const row = build(data);
        rows.push(row);
        return row;
      },
      update: async ({ where, data }) => {
        const row = rows.find((item) => matches(item, where));
        if (!row) throw Object.assign(new Error("private database detail"), { code: "P2025" });
        if (data.slug && rows.some((item) => item.id !== row.id && item.slug === data.slug)) throw Object.assign(new Error("private database detail"), { code: "P2002" });
        Object.assign(row, data);
        if (data.tags?.set) row.tags = data.tags.set.map(({ id }) => this.tags.find((tag) => tag.id === id));
        row.updatedAt = new Date();
        return row;
      },
      delete: async ({ where }) => {
        const index = rows.findIndex((item) => matches(item, where));
        if (index < 0) throw Object.assign(new Error("private database detail"), { code: "P2025" });
        if (collection === "projects" && this.caseStudies.some((study) => study.projectId === rows[index].id)) throw Object.assign(new Error("foreign key detail"), { code: "P2003" });
        return rows.splice(index, 1)[0];
      },
    };
  }

  matchesWhere(row, where = {}) {
    for (const [key, value] of Object.entries(where)) {
      if (key === "OR") {
        if (!value.some((condition) => this.matchesWhere(row, condition))) return false;
      } else if (value?.contains) {
        if (!String(row[key] ?? "").toLowerCase().includes(value.contains.toLowerCase())) return false;
      } else if (value?.equals && typeof row[key] === "string") {
        if (row[key].toLowerCase() !== value.equals.toLowerCase()) return false;
      } else if (row[key] !== value) return false;
    }
    return true;
  }
}

const goodProject = (extra = {}) => ({ title: "Example project", slug: "example-project", summary: "A useful business application.", category: "Business", status: "In progress", ...extra });
const goodPost = (extra = {}) => ({ title: "Example article", slug: "example-article", description: "An article description.", markdown: "# Notes", category: "Engineering", ...extra });
const goodCase = (projectId, extra = {}) => ({ slug: "example-case", projectId, problem: "A confirmed problem", ...extra });

test("admin handler factory rejects unauthenticated collection and item calls before service access", async () => {
  let calls = 0;
  const service = Object.fromEntries(["list", "create", "get", "update", "delete"].map((key) => [key, async () => { calls += 1; return {}; }]));
  const options = { authorize: async () => Response.json({ error: { code: "UNAUTHORIZED", message: "Sign in." } }, { status: 401 }), db: {}, service };
  const collection = createCollectionHandlers(options);
  const item = createItemHandlers(options);
  const request = (method = "GET", url = "https://example.test/api/admin/projects", body) => new Request(url, {
    method,
    ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  });
  for (const response of [await collection.GET(request()), await collection.POST(request("POST", "https://example.test/api/admin/projects", {})),
    await item.GET(request(), { params: Promise.resolve({ id: "id_1" }) }),
    await item.PATCH(request("PATCH", "https://example.test/api/admin/projects/id_1", {}), { params: Promise.resolve({ id: "id_1" }) }),
    await item.DELETE(request("DELETE", "https://example.test/api/admin/projects/id_1", { confirmation: "DELETE" }), { params: Promise.resolve({ id: "id_1" }) })]) {
    assert.equal(response.status, 401);
  }
  assert.equal(calls, 0);
});

test("request validation rejects unknown fields, malformed JSON, oversized bodies, bad URLs and invalid pagination", async () => {
  assert.throws(() => validationData(projectCreateSchema, { ...goodProject(), visibility: "PUBLIC", passwordHash: "no" }), (error) => error instanceof ApiError && error.status === 400);
  assert.throws(() => validationData(postCreateSchema, goodPost({ status: "DRAFT", publishedAt: "2026-01-01T00:00:00Z" })), (error) => error.status === 400);
  const malformed = new Request("https://example.test", { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
  await assert.rejects(readJson(malformed), (error) => error.status === 400);
  const large = new Request("https://example.test", { method: "POST", headers: { "content-type": "application/json", "content-length": "1048577" }, body: "{}" });
  await assert.rejects(readJson(large), (error) => error.status === 413);
  assert.throws(() => validationData(caseStudyCreateSchema,
    { ...goodCase("p1"), publicLinks: [{ label: "unsafe", url: "javascript:alert(1)", approved: true }] }), (error) => error.status === 400);
  assert.throws(() => parseListQuery(new Request("https://example.test/?pageSize=101")), (error) => error.status === 400);
  assert.throws(() => parseListQuery(new Request("https://example.test/?page=1&page=2")), (error) => error.status === 400);
});

test("projects create privately by default and support read, update, filtered pagination and deletion", async () => {
  const db = new MemoryCms();
  const first = await createProject(db, goodProject({ tags: ["React"] }));
  await createProject(db, goodProject({ slug: "second-project", title: "Another project", visibility: "PUBLIC", category: "Public" }));
  assert.equal(first.visibility, "PRIVATE");
  assert.equal((await getProject(db, first.id)).title, first.title);
  assert.equal((await updateProject(db, first.id, { featured: true })).featured, true);
  const page = await listProjects(db, { page: 1, pageSize: 1, q: "another", filters: { visibility: "PUBLIC" } });
  assert.equal(page.pagination.total, 1);
  assert.equal(page.data[0].slug, "second-project");
  assert.deepEqual(await deleteProject(db, first.id), { deleted: true, id: first.id });
  await assert.rejects(getProject(db, first.id), (error) => error.status === 404);
});

test("project and post slug changes retain unique permanent aliases without overwriting reserved slugs", async () => {
  const db = new MemoryCms();
  const project = await createProject(db, goodProject({ visibility: "PUBLIC" }));
  await updateProject(db, project.id, { slug: "renamed-project" });
  assert.deepEqual(db.projectSlugRedirects, [{ oldSlug: "example-project", projectId: project.id }]);
  await assert.rejects(createProject(db, goodProject({ slug: "example-project" })), (error) => error.status === 409 && error.code === "SLUG_RESERVED");

  const post = await createPost(db, goodPost({ status: "PUBLISHED" }));
  await updatePost(db, post.id, { slug: "renamed-article" });
  assert.deepEqual(db.blogPostSlugRedirects, [{ oldSlug: "example-article", blogPostId: post.id }]);
  await assert.rejects(createPost(db, goodPost({ slug: "example-article" })), (error) => error.status === 409 && error.code === "SLUG_RESERVED");
});

test("HTTP collection and item handlers expose safe CRUD responses and require delete confirmation", async () => {
  const db = new MemoryCms();
  const service = { list: listProjects, create: createProject, get: getProject, update: updateProject, delete: deleteProject };
  const authorize = async () => ({ ok: true });
  const collection = createCollectionHandlers({ authorize, db, service });
  const item = createItemHandlers({ authorize, db, service });
  const post = await collection.POST(new Request("https://example.test/api/admin/projects", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(goodProject()),
  }));
  assert.equal(post.status, 201);
  const created = (await post.json()).data;
  const context = { params: Promise.resolve({ id: created.id }) };
  assert.equal((await item.GET(new Request(`https://example.test/api/admin/projects/${created.id}`), context)).status, 200);
  const patch = await item.PATCH(new Request(`https://example.test/api/admin/projects/${created.id}`, {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ featured: true }),
  }), context);
  assert.equal((await patch.json()).data.featured, true);
  const unconfirmed = await item.DELETE(new Request(`https://example.test/api/admin/projects/${created.id}`, {
    method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({}),
  }), context);
  assert.equal(unconfirmed.status, 400);
  const confirmed = await item.DELETE(new Request(`https://example.test/api/admin/projects/${created.id}`, {
    method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation: "DELETE" }),
  }), context);
  assert.equal(confirmed.status, 200);
});

test("duplicate project slugs return a conflict without database details", async () => {
  const db = new MemoryCms();
  const collection = createCollectionHandlers({
    authorize: async () => ({ ok: true }),
    db,
    service: { list: listProjects, create: createProject },
  });
  const request = () => new Request("https://example.test/api/admin/projects", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(goodProject()),
  });
  assert.equal((await collection.POST(request())).status, 201);
  const duplicate = await collection.POST(request());
  assert.equal(duplicate.status, 409);
  assert.doesNotMatch(JSON.stringify(await duplicate.json()), /private database detail|P2002/);
});

test("successful CMS mutations invoke revalidation with previous and resulting records", async () => {
  const events = [];
  const service = {
    create: async (_db, input) => ({ slug: input.slug }),
    get: async () => ({ slug: "old-slug" }),
    update: async (_db, _id, input) => ({ slug: input.slug }),
    delete: async () => ({ deleted: true }),
  };
  const afterMutation = async (event) => events.push(event);
  const collection = createCollectionHandlers({ authorize: async () => ({ ok: true }), db: {}, service, afterMutation });
  const item = createItemHandlers({ authorize: async () => ({ ok: true }), db: {}, service, afterMutation });
  const jsonRequest = (method, url, body) => new Request(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  assert.equal((await collection.POST(jsonRequest("POST", "https://example.test/api/projects", { slug: "new-slug" }))).status, 201);
  const context = { params: Promise.resolve({ id: "item_1" }) };
  assert.equal((await item.PATCH(jsonRequest("PATCH", "https://example.test/api/projects/item_1", { slug: "new-slug" }), context)).status, 200);
  assert.equal((await item.DELETE(jsonRequest("DELETE", "https://example.test/api/projects/item_1", { confirmation: "DELETE" }), context)).status, 200);
  assert.deepEqual(events.map(({ operation }) => operation), ["create", "update", "delete"]);
  assert.deepEqual(events[1].previous, { slug: "old-slug" });
  assert.deepEqual(events[1].result, { slug: "new-slug" });
  assert.deepEqual(events[2].previous, { slug: "old-slug" });
});

test("blog posts default to drafts, publish explicitly, and support CRUD", async () => {
  const db = new MemoryCms();
  const draft = await createPost(db, goodPost({ tags: ["TypeScript"] }));
  assert.equal(draft.status, "DRAFT");
  assert.equal(draft.publishedAt, null);
  const published = await updatePost(db, draft.id, { status: "PUBLISHED" });
  assert.equal(published.status, "PUBLISHED");
  assert.ok(published.publishedAt instanceof Date);
  await assert.rejects(updatePost(db, draft.id, { publishedAt: null }), (error) => error.code === "INVALID_PUBLICATION");
  assert.equal((await getPost(db, draft.id)).slug, draft.slug);
  const page = await listPosts(db, { page: 1, pageSize: 20, q: "example", filters: { status: "PUBLISHED" } });
  assert.equal(page.pagination.total, 1);
  assert.deepEqual(await deletePost(db, draft.id), { deleted: true, id: draft.id });
});

test("case studies default to drafts, require a real project, enforce one per project and block unsafe project deletion", async () => {
  const db = new MemoryCms();
  const project = await createProject(db, goodProject());
  const longEvidence = "Owner-supplied scope, with enough context to explain the source. ".repeat(5);
  const study = await createCaseStudy(db, goodCase(project.id, { evidence: [longEvidence] }));
  assert.equal(study.status, "DRAFT");
  assert.equal(study.project.id, project.id);
  assert.equal(study.evidence[0], longEvidence.trim());
  await assert.rejects(createCaseStudy(db, goodCase("missing-project", { slug: "missing-case" })), (error) => error.status === 404);
  await assert.rejects(createCaseStudy(db, goodCase(project.id, { slug: "duplicate-case" })), (error) => error.code === "CASE_STUDY_EXISTS");
  await assert.rejects(deleteProject(db, project.id), (error) => error.status === 409 && error.code === "PROJECT_HAS_CASE_STUDY");
  const published = await updateCaseStudy(db, study.id, { status: "PUBLISHED" });
  assert.equal(published.status, "PUBLISHED");
  assert.ok(published.publishedAt instanceof Date);
  assert.equal((await listCaseStudies(db, { page: 1, pageSize: 10, q: "example", filters: { status: "PUBLISHED", projectId: project.id } })).pagination.total, 1);
  assert.equal((await getCaseStudy(db, study.id)).slug, "example-case");
  await deleteCaseStudy(db, study.id);
  assert.deepEqual(await deleteProject(db, project.id), { deleted: true, id: project.id });
});

test("database errors map to safe responses without internal messages", async () => {
  const duplicate = errorResponse(Object.assign(new Error("unique index and private value"), { code: "P2002" }));
  assert.equal(duplicate.status, 409);
  assert.doesNotMatch(JSON.stringify(await duplicate.json()), /private value|unique index/);
  const unavailable = errorResponse(Object.assign(new Error("connection includes secret"), { code: "P1001" }));
  assert.equal(unavailable.status, 503);
  assert.throws(() => validationData(projectCreateSchema, { title: "x" }), (error) => error.status === 400);
});
