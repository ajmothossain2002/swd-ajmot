import { createHash } from "node:crypto";

export const STATIC_CONTENT_INITIALIZATION_KEY = "portfolio-static-content-v1";
// A stable, app-specific PostgreSQL transaction lock serializes concurrent deployment attempts.
const advisoryLockKey = 4_708_848_621_209_323_600n;

function caseStudyHasDetails(project) {
  return Boolean(
    project.problem || project.businessContext || project.role || project.approach || project.capabilities?.length ||
    project.challenges?.length || project.architectureNote || project.technologies?.length || project.evidence?.length || project.publicLinks?.length,
  );
}

function sourceHash(projects, homepageSlugs, selectedSlugs) {
  return createHash("sha256").update(JSON.stringify({ projects, homepageSlugs, selectedSlugs })).digest("hex");
}

/**
 * Imports the initial, approved static project snapshot exactly once. The marker
 * and all row changes commit in the same transaction, so a failed run is fully
 * retryable. Existing CMS rows are treated as authoritative and never updated.
 */
export async function initializeStaticContent({ db, projects, homepageSlugs = [], selectedSlugs = [] }) {
  const fingerprint = sourceHash(projects, homepageSlugs, selectedSlugs);
  const homepage = new Set(homepageSlugs);

  return db.$transaction(async (tx) => {
    // The lock function returns PostgreSQL's `void` type; executeRaw avoids
    // trying to deserialize that non-value as a Prisma result column.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advisoryLockKey})`;

    const marker = await tx.cmsContentInitialization.findUnique({ where: { key: STATIC_CONTENT_INITIALIZATION_KEY } });
    if (marker) {
      return {
        status: "already-initialized",
        sourceChanged: marker.sourceHash !== fingerprint,
        imported: {
          projects: marker.projectsCreated,
          caseStudies: marker.caseStudiesCreated,
          blogPosts: marker.blogPostsCreated,
        },
      };
    }

    const counts = { projectsCreated: 0, projectsSkipped: 0, caseStudiesCreated: 0, caseStudiesSkipped: 0 };
    for (const source of projects) {
      let project = await tx.project.findUnique({ where: { slug: source.slug } });
      if (!project) {
        project = await tx.project.create({
          data: {
            slug: source.slug,
            title: source.title,
            summary: source.summary,
            category: source.category,
            status: source.status,
            visibility: source.visibility === "public" ? "PUBLIC" : "PRIVATE",
            featured: homepage.has(source.slug) || source.featured === true,
            sortOrder: Math.max(0, selectedSlugs.indexOf(source.slug)),
            coverImageId: null,
          },
        });
        counts.projectsCreated += 1;
      } else {
        counts.projectsSkipped += 1;
      }

      const existingCaseStudy = await tx.caseStudy.findFirst({
        where: { OR: [{ projectId: project.id }, { slug: source.slug }] },
        select: { id: true },
      });
      if (existingCaseStudy || !caseStudyHasDetails(source)) {
        counts.caseStudiesSkipped += 1;
        continue;
      }

      await tx.caseStudy.create({
        data: {
          slug: source.slug,
          projectId: project.id,
          status: "DRAFT",
          publishedAt: null,
          problem: source.problem,
          businessContext: source.businessContext,
          role: source.role,
          approach: source.approach,
          capabilities: source.capabilities ?? [],
          capabilityLabel: source.capabilityLabel,
          challenges: source.challenges,
          architectureNote: source.architectureNote,
          technologies: source.technologies ?? [],
          evidence: source.evidence ?? [],
          publicLinks: source.publicLinks,
        },
      });
      counts.caseStudiesCreated += 1;
    }

    const expectedCaseStudies = projects.filter(caseStudyHasDetails).length;
    const markerData = {
      key: STATIC_CONTENT_INITIALIZATION_KEY,
      sourceHash: fingerprint,
      expectedProjects: projects.length,
      expectedCaseStudies,
      expectedBlogPosts: 0,
      projectsCreated: counts.projectsCreated,
      projectsSkipped: counts.projectsSkipped,
      caseStudiesCreated: counts.caseStudiesCreated,
      caseStudiesSkipped: counts.caseStudiesSkipped,
      blogPostsCreated: 0,
      blogPostsSkipped: 0,
    };
    await tx.cmsContentInitialization.create({ data: markerData });
    return { status: "initialized", sourceChanged: false, ...counts, blogPostsCreated: 0, blogPostsSkipped: 0, expected: { projects: projects.length, caseStudies: expectedCaseStudies, blogPosts: 0 }, sourceHash: fingerprint };
  }, { maxWait: 10_000, timeout: 120_000 });
}
