import type { BlogPost } from "./blog.mjs";

export function parseBlogPost(source: string, filePath: string): BlogPost;
export function getPublishedBlogPosts(posts: BlogPost[]): BlogPost[];
export function findPublishedBlogPost(slug: string, posts: BlogPost[]): BlogPost | undefined;
