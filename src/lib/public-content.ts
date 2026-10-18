import "server-only";
import { prisma } from "@/lib/prisma";
import { createPublicContentService } from "@/lib/public-content-data.mjs";

const service = createPublicContentService(prisma);

async function safely<T>(query: () => Promise<T>): Promise<T> {
  try {
    return await query();
  } catch {
    throw new PublicContentUnavailableError();
  }
}

export const getPublicProjects = (options: { featured?: boolean; category?: string; limit?: number } = {}) =>
  safely(() => service.listProjects(options));

export const getPublicProject = (slug: string) => safely(() => service.getProject(slug));
export const getPublicBlogPosts = () => safely(() => service.listPosts());
export const getPublicBlogPost = (slug: string) => safely(() => service.getPost(slug));
export const getPublicSitemapContent = () => safely(() => service.sitemapContent());

export class PublicContentUnavailableError extends Error {
  constructor() {
    super("Public content is temporarily unavailable.");
    this.name = "PublicContentUnavailableError";
  }
}
