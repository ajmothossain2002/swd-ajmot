import type { Metadata } from "next";

const SITE_NAME = "Ajmot Hossain";
const DEFAULT_DESCRIPTION =
  "Web development services for businesses, from websites and frontend experiences to custom applications, APIs, and maintenance.";

export function getPublicSiteUrl(): URL | undefined {
  const value = process.env.SITE_URL;
  if (!value) return undefined;

  try {
    const url = new URL(value);
    const isLocalHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if ((url.protocol !== "https:" && !isLocalHttp) || url.username || url.password) return undefined;
    return new URL(url.origin);
  } catch {
    return undefined;
  }
}

export function getCanonicalUrl(pathname: string): string | undefined {
  const origin = getPublicSiteUrl();
  if (!origin || !pathname.startsWith("/") || pathname.startsWith("//")) return undefined;
  return new URL(pathname, origin).toString();
}

export function createPageMetadata(title: string, description: string, pathname: string): Metadata {
  const canonical = getCanonicalUrl(pathname);
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      ...(canonical ? { url: canonical } : {}),
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}

export const defaultSiteDescription = DEFAULT_DESCRIPTION;
