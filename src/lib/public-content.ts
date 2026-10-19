
import "server-only";
import { createPublicContentService } from "@/lib/public-content-data.mjs";

async function getService() {
  const { prisma } = await import("@/lib/prisma");
  return createPublicContentService(prisma);
}

function getSafeDatabaseError(error: unknown) {
  if (!error || typeof error !== "object") return {};
  const details: { name?: string; code?: string } = {};
  if ("name" in error && typeof error.name === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(error.name)) {
    details.name = error.name;
  }
  if ("code" in error && typeof error.code === "string" && /^[A-Z][A-Z0-9_]{1,31}$/.test(error.code)) {
    details.code = error.code;
  }
  return details;
}

async function safely<T>(operation: string, query: () => Promise<T>): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("Public content database query failed.", {
      operation,
      ...getSafeDatabaseError(error),
    });
    throw new PublicContentUnavailableError();
  }
}

export const getPublicProjects = (
  options: { featured?: boolean; category?: string; limit?: number } = {},
) =>
  safely("list-projects", async () => (await getService()).listProjects(options));

export const getPublicProject = (slug: string) =>
  safely("get-project", async () => (await getService()).getProject(slug));

export const getPublicBlogPosts = () =>
  safely("list-blog-posts", async () => (await getService()).listPosts());

export const getPublicBlogPost = (slug: string) =>
  safely("get-blog-post", async () => (await getService()).getPost(slug));

export const getPublicSitemapContent = () =>
  safely("get-sitemap-content", async () => (await getService()).sitemapContent());

export class PublicContentUnavailableError extends Error {
  constructor() {
    super("Public content is temporarily unavailable.");
    this.name = "PublicContentUnavailableError";
  }
}
