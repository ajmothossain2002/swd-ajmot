import type { Metadata } from "next";
import { AdminContentEditor } from "@/components/admin/admin-content-editor";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "New case study" };

export default async function NewCaseStudyPage() {
  await requireAdmin();
  return <AdminContentEditor kind="case-studies" />;
}
