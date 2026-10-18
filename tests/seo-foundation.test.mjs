import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("canonical origin is centralized on the supplied production URL with a validated override", () => {
  const seo = read("src/lib/seo.ts");
  assert.match(seo, /DEFAULT_PUBLIC_SITE_URL = "https:\/\/swd-ajmot\.vercel\.app"/);
  assert.match(seo, /process\.env\.SITE_URL \|\| DEFAULT_PUBLIC_SITE_URL/);
  assert.match(seo, /url\.protocol !== "https:"/);
  assert.match(seo, /getCanonicalUrl\(pathname\)/);
  assert.match(seo, /pathname\.startsWith\("\/\/"\)/);
});

test("indexable fixed routes define unique route-specific titles and descriptions", () => {
  const routeFiles = [
    "src/app/page.tsx",
    "src/app/services/page.tsx",
    "src/app/work/page.tsx",
    "src/app/pricing/page.tsx",
    "src/app/about/page.tsx",
    "src/app/contact/page.tsx",
    "src/app/privacy/page.tsx",
  ];
  const metadata = routeFiles.map((file) => {
    const source = read(file);
    const match = source.match(/createPageMetadata\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/);
    assert.ok(match, `${file} exports route metadata`);
    return { title: match[1], description: match[2], pathname: match[3] };
  });

  assert.equal(new Set(metadata.map(({ pathname }) => pathname)).size, routeFiles.length);
  assert.equal(new Set(metadata.map(({ title }) => title)).size, routeFiles.length);
  assert.equal(new Set(metadata.map(({ description }) => description)).size, routeFiles.length);
  assert.ok(metadata.every(({ description }) => description.length >= 50));
  const blogIndex = read("src/app/blog/page.tsx");
  assert.match(blogIndex, /posts\.length \? "Web Development Blog" : "Blog"/);
  assert.match(blogIndex, /posts\.length \? metadata : \{ \.\.\.metadata, robots: \{ index: false, follow: true \} \}/);

  const projectRoute = read("src/app/work/[slug]/page.tsx");
  const blogRoute = read("src/app/blog/[slug]/page.tsx");
  assert.match(projectRoute, /createPageMetadata\(title, project\.summary/);
  assert.match(projectRoute, /ERP Development Case Study/);
  assert.match(projectRoute, /robots: \{ index: false, follow: false \}/);
  assert.match(blogRoute, /createPageMetadata\(post\.title, post\.description/);
  assert.match(blogRoute, /twitter:\s*\{/);
});

test("robots and sitemap use the canonical origin and omit private projects and drafts", () => {
  const layout = read("src/app/layout.tsx");
  const sitemap = read("src/app/sitemap.ts");
  const robots = read("src/app/robots.ts");
  const projects = read("src/content/projects.ts");
  const publicContent = read("src/lib/public-content-data.mjs");

  assert.match(layout, /metadataBase: getPublicSiteUrl\(\)/);
  assert.doesNotMatch(layout, /alternates:\s*\{\s*canonical/);
  assert.match(robots, /allow: "\/"/);
  assert.match(robots, /disallow: "\/api\/"/);
  assert.match(robots, /new URL\("\/sitemap\.xml", origin\)/);
  assert.match(sitemap, /getPublicSitemapContent\(\)/);
  assert.match(sitemap, /projects\.map\(\(\{ slug \}\) => `\/work\/\$\{slug\}`\)/);
  assert.match(sitemap, /\.\.\.posts\.map\(\(\{ slug \}\) => `\/blog\/\$\{slug\}`\)/);
  assert.match(sitemap, /posts\.length \? \["\/blog"\] : \[\]/);
  assert.match(publicContent, /visibility: "PUBLIC"/);
  assert.match(publicContent, /status: "PUBLISHED", publishedAt: \{ not: null \}/);
  assert.match(publicContent, /caseStudy:\s*\{\s*where: publishedCaseStudyWhere/);
  assert.match(projects, /visibility: "private"/);
  assert.match(projects, /projects\.filter\(\(project\) => project\.visibility === "public"\)/);
  assert.doesNotMatch(sitemap, /content\/projects|lib\/blog\.mjs/);
  assert.doesNotMatch(read("src/app/blog/page.tsx"), /lib\/blog\.mjs/);
  assert.match(read("src/app/blog/[slug]/page.tsx"), /if \(!post\) notFound\(\)/);
});

test("social previews and structured data use verified identity without external assets", () => {
  const layout = read("src/app/layout.tsx");
  const seo = read("src/lib/seo.ts");
  const ogImage = read("src/app/opengraph-image.tsx");
  const twitterImage = read("src/app/twitter-image.tsx");
  const socialPreview = read("src/components/seo/social-preview.tsx");
  const structuredData = read("src/components/seo/structured-data.tsx");
  const blogArticle = read("src/app/blog/[slug]/page.tsx");

  assert.match(layout, /getStructuredData\(\)/);
  assert.match(structuredData, /JSON\.stringify\(data\)\.replace\(/);
  assert.match(seo, /"@type": "Person"/);
  assert.match(seo, /"@type": "WebSite"/);
  assert.doesNotMatch(seo, /sameAs|aggregateRating|review|address/);
  assert.match(blogArticle, /"@type": "BlogPosting"/);
  assert.match(blogArticle, /datePublished: post\.publishedAt/);
  assert.match(blogArticle, /if \(!post\) notFound\(\)/);
  assert.match(ogImage, /new ImageResponse\(<SocialPreview \/>, size\)/);
  assert.match(twitterImage, /new ImageResponse\(<SocialPreview \/>, size\)/);
  assert.match(socialPreview, /Ajmot Hossain/);
  assert.doesNotMatch(socialPreview, /https?:\/\//);
});
