import Image from "next/image";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { Tag } from "@/components/ui/tag";
import { StructuredData } from "@/components/seo/structured-data";
import { getPublicBlogPost } from "@/lib/public-content";
import { createPageMetadata, getCanonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPost(slug);
  if (!post) return { title: "Article not found | Ajmot Hossain", robots: { index: false, follow: false } };
  const canonicalSlug = post.redirectTo ?? post.slug;
  return {
    ...createPageMetadata(post.title, post.description, `/blog/${canonicalSlug}`),
    openGraph: {
      type: "article",
      siteName: "Ajmot Hossain",
      title: post.title,
      description: post.description,
      publishedTime: `${post.publishedAt}T00:00:00.000Z`,
      ...(getCanonicalUrl(`/blog/${canonicalSlug}`) ? { url: getCanonicalUrl(`/blog/${canonicalSlug}`) } : {}),
      images: [post.coverImage?.src ?? getCanonicalUrl("/opengraph-image")].filter((url): url is string => Boolean(url)),
    },
    twitter: {
      card: post.coverImage ? "summary_large_image" : "summary",
      title: `${post.title} | Ajmot Hossain`,
      description: post.description,
      images: [post.coverImage?.src ?? getCanonicalUrl("/twitter-image")].filter((url): url is string => Boolean(url)),
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublicBlogPost(slug);
  if (!post) notFound();
  if (post.redirectTo) permanentRedirect(`/blog/${post.redirectTo}`);
  const articleUrl = getCanonicalUrl(`/blog/${post.slug}`);
  const structuredData = articleUrl
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        inLanguage: "en",
        mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
        author: { "@type": "Person", name: "Ajmot Hossain", url: getCanonicalUrl("/about") },
        publisher: { "@type": "Person", name: "Ajmot Hossain", url: getCanonicalUrl("/about") },
        ...(post.coverImage ? { image: post.coverImage.src } : {}),
      }
    : undefined;

  return (
    <main id="main-content">
      <article className="py-section">
        {structuredData ? <StructuredData data={structuredData} /> : null}
        <PageContainer>
          <header className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{post.category} · <time dateTime={post.publishedAt}>{post.publishedAt}</time></p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] tracking-[-0.05em] sm:text-7xl">{post.title}</h1>
            <p className="mt-6 text-lg leading-8 text-muted">{post.description}</p>
            {post.tags.length ? <ul aria-label="Article tags" className="mt-6 flex flex-wrap gap-2">{post.tags.map((tag) => <li key={tag}><Tag>{tag}</Tag></li>)}</ul> : null}
          </header>
          {post.coverImage ? (
            <div className="relative mx-auto mt-12 aspect-[16/9] max-w-5xl overflow-hidden border border-line bg-accent-soft">
              <Image alt={post.coverImage.alt} className="object-cover" fill loading="eager" sizes="(max-width: 768px) 100vw, 64rem" src={post.coverImage.src} />
            </div>
          ) : null}
          <div className="prose-editorial mx-auto mt-12 max-w-3xl" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        </PageContainer>
      </article>
    </main>
  );
}
