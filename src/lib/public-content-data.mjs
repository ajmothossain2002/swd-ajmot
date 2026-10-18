import { renderSafeMarkdown } from "./safe-markdown.mjs";

export const publishedProjectWhere = { visibility: "PUBLIC" };
export const publishedCaseStudyWhere = { status: "PUBLISHED", publishedAt: { not: null } };
export const publishedPostWhere = { status: "PUBLISHED", publishedAt: { not: null } };

const projectInclude = {
  coverImage: { select: { secureUrl: true, altText: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
  caseStudy: {
    where: publishedCaseStudyWhere,
    include: {
      screenshots: {
        orderBy: { sortOrder: "asc" },
        include: { mediaAsset: { select: { secureUrl: true, altText: true } } },
      },
    },
  },
};

function toPublicProject(project) {
  const study = project.caseStudy;
  const imageAsset = project.coverImage ?? study?.screenshots?.[0]?.mediaAsset;
  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    category: project.category,
    status: project.status,
    visibility: "public",
    featured: project.featured,
    tags: project.tags?.map((tag) => tag.name) ?? [],
    technologies: study?.technologies ?? [],
    evidence: study?.evidence ?? [],
    ...(study?.problem ? { problem: study.problem } : {}),
    ...(study?.businessContext ? { businessContext: study.businessContext } : {}),
    ...(study?.role ? { role: study.role } : {}),
    ...(study?.approach ? { approach: study.approach } : {}),
    ...(study?.capabilities?.length ? { capabilities: study.capabilities } : {}),
    ...(study?.capabilityLabel ? { capabilityLabel: study.capabilityLabel } : {}),
    ...(Array.isArray(study?.challenges) ? { challenges: study.challenges } : {}),
    ...(study?.architectureNote ? { architectureNote: study.architectureNote } : {}),
    ...(imageAsset ? { image: { src: imageAsset.secureUrl, alt: imageAsset.altText } } : {}),
    ...(Array.isArray(study?.publicLinks) ? { publicLinks: study.publicLinks } : {}),
  };
}

function toPublicPost(post) {
  return {
    title: post.title,
    slug: post.slug,
    description: post.description,
    publishedAt: post.publishedAt.toISOString().slice(0, 10),
    tags: post.tags.map((tag) => tag.name),
    category: post.category,
    published: true,
    ...(post.coverImage ? { coverImage: { src: post.coverImage.secureUrl, alt: post.coverImage.altText } } : {}),
    content: post.markdown,
    contentHtml: renderSafeMarkdown(post.markdown),
  };
}

export function createPublicContentService(db) {
  return {
    async listProjects({ featured = false, category, limit = 100 } = {}) {
      const rows = await db.project.findMany({
        where: {
          ...publishedProjectWhere,
          ...(featured ? { featured: true } : {}),
          ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
        },
        include: projectInclude,
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
        take: limit,
      });
      return rows.map(toPublicProject);
    },
    async getProject(slug) {
      const row = await db.project.findFirst({ where: { slug, ...publishedProjectWhere }, include: projectInclude });
      if (row) return toPublicProject(row);
      const redirect = await db.projectSlugRedirect.findFirst({
        where: { oldSlug: slug, project: { visibility: "PUBLIC" } },
        include: { project: { include: projectInclude } },
      });
      return redirect ? { ...toPublicProject(redirect.project), redirectTo: redirect.project.slug } : undefined;
    },
    async listPosts() {
      const posts = await db.blogPost.findMany({
        where: publishedPostWhere,
        include: { tags: { select: { name: true }, orderBy: { name: "asc" } }, coverImage: { select: { secureUrl: true, altText: true } } },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 100,
      });
      return posts.map(toPublicPost);
    },
    async getPost(slug) {
      const post = await db.blogPost.findFirst({
        where: { slug, ...publishedPostWhere },
        include: { tags: { select: { name: true }, orderBy: { name: "asc" } }, coverImage: { select: { secureUrl: true, altText: true } } },
      });
      if (post) return toPublicPost(post);
      const redirect = await db.blogPostSlugRedirect.findFirst({
        where: { oldSlug: slug, blogPost: publishedPostWhere },
        include: { blogPost: { include: { tags: { select: { name: true }, orderBy: { name: "asc" } }, coverImage: { select: { secureUrl: true, altText: true } } } } },
      });
      return redirect ? { ...toPublicPost(redirect.blogPost), redirectTo: redirect.blogPost.slug } : undefined;
    },
    async sitemapContent() {
      const [projects, posts] = await Promise.all([
        db.project.findMany({ where: publishedProjectWhere, select: { slug: true, updatedAt: true } }),
        db.blogPost.findMany({ where: publishedPostWhere, select: { slug: true, updatedAt: true, publishedAt: true } }),
      ]);
      return { projects, posts };
    },
  };
}
