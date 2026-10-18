import assert from "node:assert/strict";
import test from "node:test";
import { createPublicContentService, publishedCaseStudyWhere, publishedPostWhere, publishedProjectWhere } from "../src/lib/public-content-data.mjs";
import { createCmsMutationRevalidator, pathsForCaseStudyMutation, pathsForPostMutation, pathsForProjectMutation } from "../src/lib/cms/revalidation.mjs";

test("public project reads constrain visibility and include only published related case studies", async () => {
  const calls = [];
  const db = { projectSlugRedirect: { findFirst: async (args) => { calls.push(args); return null; } }, project: { findMany: async (args) => { calls.push(args); return [{
    slug: "public-project", title: "Public project", summary: "Verified summary", category: "Business", status: "Built",
    featured: true, tags: [{ name: "React" }], caseStudy: null, coverImage: null,
  }]; }, findFirst: async (args) => { calls.push(args); return null; } } };
  const content = createPublicContentService(db);
  const projects = await content.listProjects({ featured: true });
  assert.deepEqual(calls[0].where, { visibility: "PUBLIC", featured: true });
  assert.deepEqual(calls[0].include.caseStudy.where, publishedCaseStudyWhere);
  assert.deepEqual(projects.map(({ slug }) => slug), ["public-project"]);
  assert.deepEqual(projects[0].tags, ["React"]);
  assert.equal("problem" in projects[0], false);
  assert.deepEqual(calls[0].orderBy, [{ sortOrder: "asc" }, { updatedAt: "desc" }]);
  assert.equal(await content.getProject("private-project"), undefined);
  assert.deepEqual(calls[1].where, { slug: "private-project", ...publishedProjectWhere });
});

test("blog reads filter at the database and render stored Markdown safely", async () => {
  const calls = [];
  const post = {
    title: "Published note", slug: "published-note", description: "A verified description", category: "Engineering",
    markdown: "# Safe\n\n<script>alert(1)</script> [unsafe](javascript:alert(1))",
    status: "PUBLISHED", publishedAt: new Date("2026-01-02T00:00:00.000Z"), tags: [], coverImage: null,
  };
  const db = {
    blogPostSlugRedirect: { findFirst: async (args) => { calls.push(args); return null; } },
    blogPost: { findMany: async (args) => { calls.push(args); return [post]; }, findFirst: async (args) => { calls.push(args); return args.where.slug === post.slug ? post : null; } },
  };
  const content = createPublicContentService(db);
  const listing = await content.listPosts();
  const article = await content.getPost("published-note");
  assert.deepEqual(calls[0].where, publishedPostWhere);
  assert.deepEqual(calls[1].where, { slug: "published-note", ...publishedPostWhere });
  assert.equal(listing[0].publishedAt, "2026-01-02");
  assert.match(article.contentHtml, /<h1>Safe<\/h1>/);
  assert.doesNotMatch(article.contentHtml, /<script|javascript:/i);
  assert.equal(await content.getPost("draft-note"), undefined);
});

test("published case-study fields and ordered media attach only to their public project", async () => {
  let query;
  const row = {
    slug: "erp", title: "ERP", summary: "Approved summary", category: "Business", status: "Internal use", featured: true,
    tags: [], coverImage: null,
    caseStudy: {
      status: "PUBLISHED", publishedAt: new Date("2026-01-01T00:00:00Z"), problem: "Approved problem", role: "Development",
      technologies: ["TypeScript"], evidence: ["Owner-supplied scope"], screenshots: [{ mediaAsset: { secureUrl: "https://res.cloudinary.com/demo/image/upload/erp.webp", altText: "ERP screen" } }],
    },
  };
  const service = createPublicContentService({ project: { findFirst: async (args) => { query = args; return row; } } });
  const project = await service.getProject("erp");
  assert.equal(query.where.visibility, "PUBLIC");
  assert.equal(query.include.caseStudy.where.status, "PUBLISHED");
  assert.equal(project.problem, "Approved problem");
  assert.deepEqual(project.technologies, ["TypeScript"]);
  assert.deepEqual(project.image, { src: "https://res.cloudinary.com/demo/image/upload/erp.webp", alt: "ERP screen" });
});

test("old project and article slugs resolve only to still-public/published canonical records", async () => {
  const projectRow = { slug: "new-project", title: "Project", summary: "Summary", category: "Business", status: "Active", featured: false, tags: [], caseStudy: null, coverImage: null };
  const postRow = { title: "Article", slug: "new-article", description: "Description", category: "Engineering", markdown: "# Article", publishedAt: new Date("2026-03-04T00:00:00Z"), tags: [], coverImage: null };
  const queries = [];
  const content = createPublicContentService({
    project: { findFirst: async () => null },
    projectSlugRedirect: { findFirst: async (args) => { queries.push(args); return { project: projectRow }; } },
    blogPost: { findFirst: async () => null },
    blogPostSlugRedirect: { findFirst: async (args) => { queries.push(args); return { blogPost: postRow }; } },
  });
  assert.equal((await content.getProject("old-project")).redirectTo, "new-project");
  assert.equal((await content.getPost("old-article")).redirectTo, "new-article");
  assert.deepEqual(queries[0].where, { oldSlug: "old-project", project: { visibility: "PUBLIC" } });
  assert.deepEqual(queries[1].where, { oldSlug: "old-article", blogPost: publishedPostWhere });
});

test("sitemap queries only public projects and dated published articles", async () => {
  const calls = [];
  const db = {
    project: { findMany: async (args) => { calls.push(args); return []; } },
    blogPost: { findMany: async (args) => { calls.push(args); return []; } },
  };
  await createPublicContentService(db).sitemapContent();
  assert.deepEqual(calls[0].where, publishedProjectWhere);
  assert.deepEqual(calls[1].where, publishedPostWhere);
  assert.equal(calls[1].select.publishedAt, true);
});

test("admin mutations invalidate affected list, old/new detail, homepage and sitemap paths", async () => {
  assert.deepEqual(pathsForProjectMutation({ previous: { slug: "before" }, result: { slug: "after" } }), ["/", "/work", "/sitemap.xml", "/work/before", "/work/after"]);
  assert.deepEqual(pathsForPostMutation({ previous: { slug: "before" }, result: { slug: "after" } }), ["/blog", "/sitemap.xml", "/blog/before", "/blog/after"]);
  assert.deepEqual(pathsForCaseStudyMutation({ previous: { project: { slug: "old-project" } }, result: { project: { slug: "new-project" } } }), ["/", "/work", "/sitemap.xml", "/work/old-project", "/work/new-project"]);
  const invalidated = [];
  const revalidate = createCmsMutationRevalidator((path) => invalidated.push(path), pathsForPostMutation);
  await revalidate({ previous: { slug: "draft" }, result: { slug: "published" } });
  assert.deepEqual(invalidated, ["/blog", "/sitemap.xml", "/blog/draft", "/blog/published"]);
});
