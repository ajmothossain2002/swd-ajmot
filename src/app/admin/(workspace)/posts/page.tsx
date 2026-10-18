import type { Metadata } from "next";
import { AdminContentList } from "@/components/admin/admin-content-list";
import { PageContainer } from "@/components/ui/page-container";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Blog posts" };

export default async function AdminPostsPage() {
  await requireAdmin();
  return <main className="py-10 sm:py-14" id="main-content"><PageContainer className="!px-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Content</p><h1 className="mt-2 font-display text-4xl tracking-[-0.045em] sm:text-5xl">Blog posts</h1><p className="mt-3 max-w-2xl text-sm text-muted">Draft, review and publish Markdown articles.</p><AdminContentList resource="posts" /></PageContainer></main>;
}
