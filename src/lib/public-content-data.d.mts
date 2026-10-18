import type { ProjectCaseStudy } from "../content/projects.js";
import type { BlogPost } from "./blog.mjs";

export type PublicProject = ProjectCaseStudy & { tags: string[]; redirectTo?: string };
export type PublicBlogPost = BlogPost & { redirectTo?: string };
export const publishedProjectWhere: { visibility: "PUBLIC" };
export const publishedCaseStudyWhere: { status: "PUBLISHED"; publishedAt: { not: null } };
export const publishedPostWhere: { status: "PUBLISHED"; publishedAt: { not: null } };
export function createPublicContentService(db: unknown): {
  listProjects(options?: { featured?: boolean; category?: string; limit?: number }): Promise<PublicProject[]>;
  getProject(slug: string): Promise<PublicProject | undefined>;
  listPosts(): Promise<BlogPost[]>;
  getPost(slug: string): Promise<PublicBlogPost | undefined>;
  sitemapContent(): Promise<{ projects: Array<{ slug: string; updatedAt: Date }>; posts: Array<{ slug: string; updatedAt: Date; publishedAt: Date | null }> }>;
};
