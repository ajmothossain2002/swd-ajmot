import test from "node:test";
import assert from "node:assert/strict";
import { homepageProjects, projects, selectedProjects } from "../src/content/projects.ts";
import { initializeStaticContent, STATIC_CONTENT_INITIALIZATION_KEY } from "../src/lib/cms/static-content-initializer.mjs";

function memoryDatabase({ failCaseStudyAfter = Number.POSITIVE_INFINITY, initialProjects = [], initialCaseStudies = [] } = {}) {
  let state = { projects: initialProjects, caseStudies: initialCaseStudies, marker: null, mediaAssets: [] };
  let failAfter = failCaseStudyAfter;
  let queue = Promise.resolve();
  let lockCalls = 0;
  const db = {
    $transaction: async (work) => {
      let transactionState;
      let release;
      const tx = {
        $executeRaw: async (strings, ...values) => {
          assert.match(strings.join("?"), /pg_advisory_xact_lock/);
          assert.equal(typeof values[0], "bigint");
          const prior = queue;
          let unlock;
          queue = new Promise((resolve) => { unlock = resolve; });
          await prior;
          release = unlock;
          lockCalls += 1;
          transactionState = structuredClone(state);
          return [];
        },
        project: {
          findUnique: async ({ where }) => transactionState.projects.find((project) => project.slug === where.slug) ?? null,
          create: async ({ data }) => {
            const project = { id: `project-${transactionState.projects.length + 1}`, ...data };
            transactionState.projects.push(project);
            return project;
          },
        },
        caseStudy: {
          findFirst: async ({ where }) => transactionState.caseStudies.find((item) => where.OR.some((condition) =>
            (condition.projectId && item.projectId === condition.projectId) || (condition.slug && item.slug === condition.slug))) ?? null,
          create: async ({ data }) => {
            if (transactionState.caseStudies.length >= failAfter) throw new Error("injected failure");
            const item = { id: `case-study-${transactionState.caseStudies.length + 1}`, ...data };
            transactionState.caseStudies.push(item);
            return item;
          },
        },
        cmsContentInitialization: {
          findUnique: async ({ where }) => transactionState.marker?.key === where.key ? transactionState.marker : null,
          create: async ({ data }) => { transactionState.marker = { ...data, completedAt: new Date("2026-01-01T00:00:00Z") }; return transactionState.marker; },
        },
      };
      try {
        const result = await work(tx);
        state = transactionState;
        return result;
      } finally { release?.(); }
    },
  };
  return { db, get state() { return state; }, get lockCalls() { return lockCalls; }, setFailAfter(value) { failAfter = value; } };
}

function initialize(db) {
  return initializeStaticContent({ db, projects, homepageSlugs: homepageProjects.map(({ slug }) => slug), selectedSlugs: selectedProjects.map(({ slug }) => slug) });
}

test("first initialization imports approved projects and draft case studies with no media", async () => {
  const memory = memoryDatabase();
  const result = await initialize(memory.db);
  assert.equal(result.status, "initialized");
  assert.deepEqual(result.expected, { projects: 7, caseStudies: 7, blogPosts: 0 });
  assert.equal(memory.state.projects.length, 7);
  assert.equal(memory.state.caseStudies.length, 7);
  assert.equal(memory.state.mediaAssets.length, 0);
  assert.ok(memory.state.projects.every((project) => project.coverImageId === null));
  assert.ok(memory.state.caseStudies.every((item) => item.status === "DRAFT" && item.publishedAt === null && !("screenshots" in item)));
  assert.equal(memory.state.projects.filter((project) => project.visibility === "PUBLIC").length, 6);
  assert.equal(memory.state.projects.find((project) => project.slug === "private-store").visibility, "PRIVATE");
  assert.equal(memory.state.marker.key, STATIC_CONTENT_INITIALIZATION_KEY);
  assert.equal(memory.state.marker.expectedProjects, 7);
  assert.equal(memory.state.marker.projectsCreated + memory.state.marker.projectsSkipped, memory.state.marker.expectedProjects);
  assert.equal(memory.state.marker.caseStudiesCreated + memory.state.marker.caseStudiesSkipped, memory.state.marker.expectedCaseStudies);
});

test("completed initialization makes later runs a no-op and preserves CMS edits", async () => {
  const memory = memoryDatabase();
  await initialize(memory.db);
  const project = memory.state.projects.find((item) => item.slug === "enterprise-erp-system");
  project.title = "CMS-edited title";
  project.summary = "CMS-edited summary";
  project.visibility = "PRIVATE";
  const caseStudy = memory.state.caseStudies.find((item) => item.slug === project.slug);
  caseStudy.role = "CMS-edited role";
  caseStudy.status = "PUBLISHED";
  caseStudy.publishedAt = new Date("2026-01-02T00:00:00Z");
  const before = structuredClone(memory.state);

  const result = await initialize(memory.db);
  assert.equal(result.status, "already-initialized");
  assert.equal(result.sourceChanged, false);
  assert.deepEqual(memory.state, before);
});

test("pre-existing CMS rows are skipped without changing their fields", async () => {
  const project = { id: "existing-project", slug: "enterprise-erp-system", title: "CMS-owned title", summary: "CMS-owned summary", category: "CMS category", status: "CMS status", visibility: "PRIVATE", featured: false, sortOrder: 81, coverImageId: null };
  const caseStudy = { id: "existing-study", slug: project.slug, projectId: project.id, status: "PUBLISHED", publishedAt: new Date("2026-01-01T00:00:00Z"), role: "CMS-owned role" };
  const memory = memoryDatabase({ initialProjects: [project], initialCaseStudies: [caseStudy] });
  const beforeProject = structuredClone(project); const beforeStudy = structuredClone(caseStudy);
  const result = await initialize(memory.db);
  assert.equal(result.status, "initialized");
  assert.equal(result.projectsSkipped, 1);
  assert.equal(result.caseStudiesSkipped, 1);
  assert.deepEqual(memory.state.projects[0], beforeProject);
  assert.deepEqual(memory.state.caseStudies[0], beforeStudy);
});

test("a changed static source is reported but never silently imported after initialization", async () => {
  const memory = memoryDatabase();
  await initialize(memory.db);
  const extra = { ...projects[0], slug: "later-static-addition" };
  const result = await initializeStaticContent({
    db: memory.db,
    projects: [...projects, extra],
    homepageSlugs: homepageProjects.map(({ slug }) => slug),
    selectedSlugs: selectedProjects.map(({ slug }) => slug),
  });
  assert.equal(result.status, "already-initialized");
  assert.equal(result.sourceChanged, true);
  assert.equal(memory.state.projects.length, 7);
  assert.equal(memory.state.projects.some((project) => project.slug === extra.slug), false);
});

test("a failed partial transaction leaves no marker or rows and can be retried", async () => {
  const memory = memoryDatabase({ failCaseStudyAfter: 2 });
  await assert.rejects(initialize(memory.db), /injected failure/);
  assert.equal(memory.state.projects.length, 0);
  assert.equal(memory.state.caseStudies.length, 0);
  assert.equal(memory.state.marker, null);
  memory.setFailAfter(Number.POSITIVE_INFINITY);
  const result = await initialize(memory.db);
  assert.equal(result.status, "initialized");
  assert.equal(memory.state.projects.length, 7);
  assert.equal(memory.state.caseStudies.length, 7);
});

test("concurrent initializers serialize and only one creates the snapshot", async () => {
  const memory = memoryDatabase();
  const results = await Promise.all([initialize(memory.db), initialize(memory.db)]);
  assert.deepEqual(results.map(({ status }) => status).sort(), ["already-initialized", "initialized"]);
  assert.equal(memory.state.projects.length, 7);
  assert.equal(memory.state.caseStudies.length, 7);
  assert.equal(memory.lockCalls, 2);
});
