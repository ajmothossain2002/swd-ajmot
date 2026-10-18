import type { MetadataRoute } from "next";
import { publicProjects } from "@/content/projects";
import { getBlogPosts } from "@/lib/blog.mjs";
import { getPublicSiteUrl } from "@/lib/seo";

const staticRoutes = ["/", "/services", "/work", "/pricing", "/about", "/contact", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getPublicSiteUrl();
  if (!origin) return [];

  const posts = getBlogPosts();
  const routes = [
    ...staticRoutes,
    ...(posts.length ? ["/blog"] : []),
    ...publicProjects.map(({ slug }) => `/work/${slug}`),
    ...posts.map(({ slug }) => `/blog/${slug}`),
  ];

  return routes.map((route) => ({ url: new URL(route, origin).toString() }));
}
