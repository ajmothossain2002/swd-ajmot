export function getAdminIdentity(session) {
  const user = session?.user;
  if (typeof user?.id !== "string" || typeof user?.email !== "string") return null;
  return { id: user.id, email: user.email };
}

export const registrationDisabled = true;

export function isAuthEnvironmentConfigured(env = process.env) {
  if (env.NODE_ENV !== "production") return true;
  if (typeof env.BETTER_AUTH_SECRET !== "string" || Buffer.byteLength(env.BETTER_AUTH_SECRET) < 32) return false;
  try {
    const url = new URL(env.BETTER_AUTH_URL || "");
    return url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash;
  } catch {
    return false;
  }
}
