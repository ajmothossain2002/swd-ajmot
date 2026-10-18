import "server-only";
import { auth } from "@/lib/auth/config";
import { getAdminIdentity, isAuthEnvironmentConfigured } from "@/lib/auth/access-policy.mjs";

export async function requireAdminApi(request: Request): Promise<{ ok: true } | Response> {
  if (!isAuthEnvironmentConfigured()) {
    return Response.json({ error: { code: "AUTH_UNAVAILABLE", message: "Admin authentication is not configured." } }, { status: 503 });
  }
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!getAdminIdentity(session)) {
      return Response.json({ error: { code: "UNAUTHORIZED", message: "Sign in as an administrator to continue." } }, { status: 401 });
    }
    return { ok: true };
  } catch {
    return Response.json({ error: { code: "AUTH_UNAVAILABLE", message: "Admin authentication is temporarily unavailable." } }, { status: 503 });
  }
}
