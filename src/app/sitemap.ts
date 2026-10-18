import type { MetadataRoute } from "next";
import { getPublicSitemapContent } from "@/lib/public-content";
import { getPublicSiteUrl } from "@/lib/seo";

const staticRoutes = ["/", "/services", "/work", "/pricing", "/about", "/contact", "/privacy"];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getPublicSiteUrl();
  if (!origin) return [];

  const { projects, posts } = await getPublicSitemapContent();
  const routes = [
    ...staticRoutes,
    ...(posts.length ? ["/blog"] : []),
    ...projects.map(({ slug }) => `/work/${slug}`),
    ...posts.map(({ slug }) => `/blog/${slug}`),
  ];

  return routes.map((route) => ({ url: new URL(route, origin).toString() }));
}
