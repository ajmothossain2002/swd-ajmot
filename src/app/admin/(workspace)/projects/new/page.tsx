import type { Metadata } from "next";
import { AdminContentEditor } from "@/components/admin/admin-content-editor";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin();
  return <AdminContentEditor kind="projects" />;
}
