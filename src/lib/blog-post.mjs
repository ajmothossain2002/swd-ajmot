import path from "node:path";
import matter from "gray-matter";
import { renderSafeMarkdown } from "./safe-markdown.mjs";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** @param {string} source @param {string} filePath */
export function parseBlogPost(source, filePath) {
  const parsed = matter(source);
  const metadata = parsed.data;
  if (!isPlainObject(metadata)) throw new Error(`Invalid blog metadata in ${path.basename(filePath)}.`);
  const filenameSlug = path.basename(filePath, ".md");
  const slug = typeof metadata.slug === "string" ? metadata.slug : filenameSlug;

  if (!slugPattern.test(slug) || slug !== filenameSlug) throw new Error(`Invalid blog metadata in ${path.basename(filePath)}.`);
  if (typeof metadata.title !== "string" || !metadata.title.trim()) throw new Error(`Missing title in ${path.basename(filePath)}.`);
  if (typeof metadata.description !== "string" || !metadata.description.trim()) throw new Error(`Missing description in ${path.basename(filePath)}.`);
  if (typeof metadata.category !== "string" || !metadata.category.trim()) throw new Error(`Missing category in ${path.basename(filePath)}.`);
  if (typeof metadata.published !== "boolean") throw new Error(`Set published to true or false in ${path.basename(filePath)}.`);
  const parsedPublicationDate = typeof metadata.publishedAt === "string" ? new Date(`${metadata.publishedAt}T00:00:00Z`) : undefined;
  if (typeof metadata.publishedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(metadata.publishedAt) || Number.isNaN(parsedPublicationDate?.getTime()) || parsedPublicationDate?.toISOString().slice(0, 10) !== metadata.publishedAt) {
    throw new Error(`Use a YYYY-MM-DD publication date in ${path.basename(filePath)}.`);
  }
  if (metadata.tags !== undefined && (!Array.isArray(metadata.tags) || metadata.tags.some((tag) => typeof tag !== "string"))) {
    throw new Error(`Tags must be a list of text values in ${path.basename(filePath)}.`);
  }

  let coverImage;
  if (metadata.coverImage !== undefined) {
    if (typeof metadata.coverImage !== "string" || !metadata.coverImage.startsWith("/") || metadata.coverImage.startsWith("//") || metadata.coverImage.includes("\\") || typeof metadata.coverImageAlt !== "string" || !metadata.coverImageAlt.trim()) {
      throw new Error(`Cover images need a local path and descriptive alt text in ${path.basename(filePath)}.`);
    }
    coverImage = { src: metadata.coverImage, alt: metadata.coverImageAlt.trim() };
  }

  return {
    title: metadata.title.trim(),
    slug,
    description: metadata.description.trim(),
    publishedAt: metadata.publishedAt,
    tags: metadata.tags ?? [],
    category: metadata.category.trim(),
    published: metadata.published,
    ...(coverImage ? { coverImage } : {}),
    content: parsed.content.trim(),
    contentHtml: renderSafeMarkdown(parsed.content),
  };
}

/** @param {ReturnType<typeof parseBlogPost>[]} posts */
export function getPublishedBlogPosts(posts) {
  return posts.filter((post) => post.published).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** @param {string} slug @param {ReturnType<typeof parseBlogPost>[]} posts */
export function findPublishedBlogPost(slug, posts) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined;
  return posts.find((post) => post.published && post.slug === slug);
}
