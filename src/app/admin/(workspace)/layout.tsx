import { AdminNavigation } from "@/components/admin/admin-navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <div className="mx-auto min-h-screen w-full max-w-[100rem] px-5 py-5 sm:px-8 lg:px-10">
      <AdminNavigation />
      {children}
    </div>
  );
}
