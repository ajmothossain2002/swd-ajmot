import type { Metadata } from "next";
import { AdminContentEditor } from "@/components/admin/admin-content-editor";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  return <AdminContentEditor id={id} kind="projects" />;
}
