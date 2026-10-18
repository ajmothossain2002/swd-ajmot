import type { Metadata } from "next";
import { AdminContentEditor } from "@/components/admin/admin-content-editor";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "New blog post" };

export default async function NewPostPage() {
  await requireAdmin();
  return <AdminContentEditor kind="posts" />;
}
