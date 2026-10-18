export type BlogCoverImage = { src: string; alt: string };
export type BlogPost = {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  tags: string[];
  category: string;
  published: boolean;
  coverImage?: BlogCoverImage;
  content: string;
  contentHtml: string;
};
export function getBlogPosts(): BlogPost[];
export function getBlogPostBySlug(slug: string): BlogPost | undefined;
export function getBlogCanonical(slug: string, siteUrl?: string): string | undefined;
