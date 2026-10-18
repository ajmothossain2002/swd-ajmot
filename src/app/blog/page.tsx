import Link from "next/link";
import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Tag } from "@/components/ui/tag";
import { getPublicBlogPosts } from "@/lib/public-content";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const posts = await getPublicBlogPosts();
  const metadata = createPageMetadata(
    posts.length ? "Web Development Blog" : "Blog",
    posts.length
      ? "Published articles on web development and software projects by Ajmot Hossain."
      : "No articles are approved for publication yet. New writing will appear here when it is ready to share.",
    "/blog",
  );

  return posts.length ? metadata : { ...metadata, robots: { index: false, follow: true } };
}

export default async function BlogPage() {
  const posts = await getPublicBlogPosts();

  return (
    <main id="main-content">
      <section aria-labelledby="blog-title" className="py-section">
        <PageContainer>
          <div className="max-w-3xl">
            <SectionHeading as="h1" eyebrow="Blog" id="blog-title" title="Notes from the work." />
            <p className="mt-5 text-base leading-7 text-muted">Published writing on practical web development, projects, and product decisions.</p>
          </div>
          {posts.length ? (
            <ol className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-2">
              {posts.map((post) => (
                <li className="border-t border-line pt-5" key={post.slug}>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">{post.category} · <time dateTime={post.publishedAt}>{post.publishedAt}</time></p>
                  <h2 className="mt-4 font-display text-2xl tracking-[-0.03em] sm:text-3xl">
                    <Link className="transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus" href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{post.description}</p>
                  {post.tags.length ? <ul aria-label="Article tags" className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag) => <li key={tag}><Tag>{tag}</Tag></li>)}</ul> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-12 border-t border-line py-8 font-display text-2xl leading-snug sm:text-3xl">No articles have been approved for publication yet.</p>
          )}
        </PageContainer>
      </section>
    </main>
  );
}
