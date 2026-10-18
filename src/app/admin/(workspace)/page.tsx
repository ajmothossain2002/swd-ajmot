import Link from "next/link";
import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/page-container";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const [projectCount, postCount, caseStudyCount, projects, posts, caseStudies] = await Promise.all([
    prisma.project.count(),
    prisma.blogPost.count(),
    prisma.caseStudy.count(),
    prisma.project.findMany({ take: 5, orderBy: { updatedAt: "desc" }, select: { id: true, slug: true, title: true, visibility: true, updatedAt: true } }),
    prisma.blogPost.findMany({ take: 5, orderBy: { updatedAt: "desc" }, select: { id: true, slug: true, title: true, status: true, updatedAt: true } }),
    prisma.caseStudy.findMany({ take: 5, orderBy: { updatedAt: "desc" }, select: { id: true, status: true, updatedAt: true, project: { select: { title: true } } } }),
  ]);
  const recent = [
    ...projects.map((item) => ({ id: item.id, title: item.title, type: "Project", status: item.visibility, href: `/admin/projects/${item.id}/edit`, updatedAt: item.updatedAt })),
    ...posts.map((item) => ({ id: item.id, title: item.title, type: "Blog post", status: item.status, href: `/admin/posts/${item.id}/edit`, updatedAt: item.updatedAt })),
    ...caseStudies.map((item) => ({ id: item.id, title: item.project.title, type: "Case study", status: item.status, href: `/admin/case-studies/${item.id}/edit`, updatedAt: item.updatedAt })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 8);
  const stats = [
    { label: "Projects", count: projectCount, href: "/admin/projects" },
    { label: "Blog posts", count: postCount, href: "/admin/posts" },
    { label: "Case studies", count: caseStudyCount, href: "/admin/case-studies" },
  ];

  return (
    <main className="py-10 sm:py-14" id="main-content">
      <PageContainer className="!px-0">
        <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Private workspace</p>
            <h1 className="mt-2 font-display text-4xl tracking-[-0.045em] sm:text-5xl">Overview</h1>
            <p className="mt-3 text-sm text-muted">Review and manage portfolio content.</p>
          </div>
          <p className="text-sm text-muted">Signed in as {admin.email}</p>
        </div>

        <section aria-label="Content counts" className="mt-7 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <Link className="border border-line bg-surface p-5 transition-colors hover:border-accent" href={stat.href} key={stat.label}>
              <span className="text-sm text-muted">{stat.label}</span>
              <span className="mt-3 block font-display text-4xl tabular-nums">{stat.count}</span>
              <span className="mt-3 block text-xs text-accent">Open collection ↗</span>
            </Link>
          ))}
        </section>

        <section aria-labelledby="recent-title" className="mt-12">
          <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">Latest changes</p>
              <h2 className="mt-2 font-display text-2xl tracking-[-0.03em]" id="recent-title">Recently updated</h2>
            </div>
          </div>
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((item) => (
                <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between" key={`${item.type}-${item.id}`}>
                  <div>
                    <Link className="font-medium hover:text-accent" href={item.href}>{item.title}</Link>
                    <p className="mt-1 text-xs text-muted">{item.type} · {item.status.toLowerCase()}</p>
                  </div>
                  <time className="text-xs text-muted" dateTime={item.updatedAt.toISOString()}>{item.updatedAt.toLocaleDateString("en", { dateStyle: "medium" })}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-sm text-muted">No content yet. Create a project, post or case study to get started.</p>
          )}
        </section>
      </PageContainer>
    </main>
  );
}
