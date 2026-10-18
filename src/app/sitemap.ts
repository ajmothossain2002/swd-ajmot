import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { getBlogPosts } from "@/lib/blog.mjs";
import { getPublicSiteUrl } from "@/lib/seo";

const staticRoutes = ["/", "/services", "/work", "/pricing", "/about", "/blog", "/contact", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getPublicSiteUrl();
  if (!origin) return [];

  const routes = [
    ...staticRoutes,
    ...projects.map(({ slug }) => `/work/${slug}`),
    ...getBlogPosts().map(({ slug }) => `/blog/${slug}`),
  ];

  return routes.map((route) => ({ url: new URL(route, origin).toString() }));
}
