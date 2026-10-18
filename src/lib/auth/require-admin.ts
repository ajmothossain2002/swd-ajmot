import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getAdminIdentity, isAuthEnvironmentConfigured } from "@/lib/auth/access-policy.mjs";

export async function requireAdmin() {
  if (!isAuthEnvironmentConfigured()) redirect("/admin/login");

  const session = await auth.api.getSession({ headers: await headers() });
  const admin = getAdminIdentity(session);
  if (!admin) redirect("/admin/login");

  return admin;
}
