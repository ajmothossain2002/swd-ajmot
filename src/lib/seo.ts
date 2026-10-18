import type { Metadata } from "next";

const SITE_NAME = "Ajmot Hossain";
// This is the current production host supplied by Ajmot. Change it only after
// a replacement public domain has been configured and approved.
const DEFAULT_PUBLIC_SITE_URL = "https://swd-ajmot.vercel.app";
const DEFAULT_DESCRIPTION =
  "Full-stack developer building business websites, custom web applications, backend APIs, and business systems. Explore projects and discuss your requirements.";

export function getPublicSiteUrl(): URL | undefined {
  const value = process.env.SITE_URL || DEFAULT_PUBLIC_SITE_URL;

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
  const openGraphImage = getCanonicalUrl("/opengraph-image");
  const twitterImage = getCanonicalUrl("/twitter-image");
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

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
      ...(openGraphImage ? { images: [{ url: openGraphImage, alt: "Ajmot Hossain, Full-Stack Developer" }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(twitterImage ? { images: [twitterImage] } : {}),
    },
  };
}

export const defaultSiteDescription = DEFAULT_DESCRIPTION;

export function getStructuredData() {
  const url = getPublicSiteUrl();
  if (!url) return undefined;

  const personId = new URL("/about#person", url).toString();
  const websiteId = new URL("/#website", url).toString();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: SITE_NAME,
        jobTitle: "Full-Stack Developer",
        url: new URL("/about", url).toString(),
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: SITE_NAME,
        url: url.toString(),
        inLanguage: "en",
        publisher: { "@id": personId },
      },
    ],
  };
}
