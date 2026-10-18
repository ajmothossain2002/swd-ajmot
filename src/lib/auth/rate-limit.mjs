import { createHash } from "node:crypto";

const LIMIT = 10;
const WINDOW_SECONDS = 15 * 60;
const localAttempts = new Map();

function getClientAddress(request) {
  // Vercel overwrites x-real-ip at its edge. Never fall back to an untrusted
  // leftmost x-forwarded-for value supplied by a browser.
  return request.headers.get("x-real-ip") || "unknown";
}

export async function checkAndRecordLoginAttempt(request, {
  env = process.env,
  fetchImpl = fetch,
  now = Date.now,
} = {}) {
  const address = getClientAddress(request);
  const keyHash = createHash("sha256").update(address).digest("hex");
  const key = `admin-login:${keyHash}`;

  if (env.NODE_ENV === "production") {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      return { allowed: false, reason: "configuration" };
    }

    try {
      const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return n";
      const response = await fetchImpl(env.UPSTASH_REDIS_REST_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(["EVAL", script, 1, key, WINDOW_SECONDS]),
        cache: "no-store",
      });
      if (!response.ok) return { allowed: false, reason: "unavailable" };
      const body = await response.json();
      const count = Number(body.result);
      return Number.isFinite(count)
        ? { allowed: count <= LIMIT }
        : { allowed: false, reason: "unavailable" };
    } catch {
      return { allowed: false, reason: "unavailable" };
    }
  }

  const time = now();
  const existing = localAttempts.get(key);
  const attempt = existing && existing.expiresAt > time
    ? { count: existing.count + 1, expiresAt: existing.expiresAt }
    : { count: 1, expiresAt: time + WINDOW_SECONDS * 1000 };
  localAttempts.set(key, attempt);
  return { allowed: attempt.count <= LIMIT };
}

export function clearLocalLoginAttempts() {
  localAttempts.clear();
}
