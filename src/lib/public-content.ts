
import "server-only";
import { createPublicContentService } from "@/lib/public-content-data.mjs";

async function getService() {
  const { prisma } = await import("@/lib/prisma");
  return createPublicContentService(prisma);
}

async function safely<T>(query: () => Promise<T>): Promise<T> {
  try {
    return await query();
  } catch {
    throw new PublicContentUnavailableError();
  }
}

export const getPublicProjects = (
  options: { featured?: boolean; category?: string; limit?: number } = {},
) =>
  safely(async () => (await getService()).listProjects(options));

export const getPublicProject = (slug: string) =>
  safely(async () => (await getService()).getProject(slug));

export const getPublicBlogPosts = () =>
  safely(async () => (await getService()).listPosts());

export const getPublicBlogPost = (slug: string) =>
  safely(async () => (await getService()).getPost(slug));

export const getPublicSitemapContent = () =>
  safely(async () => (await getService()).sitemapContent());

export class PublicContentUnavailableError extends Error {
  constructor() {
    super("Public content is temporarily unavailable.");
    this.name = "PublicContentUnavailableError";
  }
}
