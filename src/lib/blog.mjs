import fs from "node:fs";
import path from "node:path";
import { findPublishedBlogPost, getPublishedBlogPosts, parseBlogPost } from "./blog-post.mjs";

const contentDirectory = path.join(process.cwd(), "src", "content", "blog");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function getBlogPosts() {
  if (!fs.existsSync(contentDirectory)) return [];
  const posts = fs.readdirSync(contentDirectory)
    .filter((name) => name.endsWith(".md"))
    .map((name) => parseBlogPost(fs.readFileSync(path.join(contentDirectory, name), "utf8"), name));
  return getPublishedBlogPosts(posts);
}

export function getBlogPostBySlug(slug) {
  if (!slugPattern.test(slug)) return undefined;
  const filePath = path.join(contentDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return undefined;
  const post = parseBlogPost(fs.readFileSync(filePath, "utf8"), filePath);
  return findPublishedBlogPost(slug, [post]);
}

/** @param {string} slug @param {string | undefined} [siteUrl] */
export function getBlogCanonical(slug, siteUrl = process.env.SITE_URL) {
  if (!siteUrl) return undefined;
  try {
    const base = new URL(siteUrl);
    if ((base.protocol !== "https:" && base.hostname !== "localhost") || base.username || base.password) return undefined;
    return new URL(`/blog/${slug}`, base).toString();
  } catch {
    return undefined;
  }
}
