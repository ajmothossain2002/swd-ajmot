import type { Metadata } from "next";
import { AdminContentEditor } from "@/components/admin/admin-content-editor";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Edit blog post" };

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  return <AdminContentEditor id={id} kind="posts" />;
}
