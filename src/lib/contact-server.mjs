import { createHash } from "node:crypto";
import { validateContactPayload } from "./contact-validation.mjs";

export const MAX_CONTACT_BODY_BYTES = 12_000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export class ContactBodyError extends Error {
  /** @param {"too_large" | "malformed"} reason */
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

/** @param {Request} request @param {number} [maximumBytes] */
export async function readContactJson(request, maximumBytes = MAX_CONTACT_BODY_BYTES) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new ContactBodyError("too_large");
  }
  if (!request.body) throw new ContactBodyError("malformed");

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        throw new ContactBodyError("too_large");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ContactBodyError) throw error;
    throw new ContactBodyError("malformed");
  }

  try {
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ContactBodyError("malformed");
  }
}

/** @param {{ limit?: number, windowMs?: number, now?: () => number }} [options] */
export function createContactRateLimiter(options = {}) {
  const limit = options.limit ?? RATE_LIMIT_MAX;
  const windowMs = options.windowMs ?? RATE_LIMIT_WINDOW_MS;
  const now = options.now ?? Date.now;
  /** @type {Map<string, { count: number, expiresAt: number }>} */
  const attempts = new Map();

  return {
    /** @param {string} key */
    check(key) {
      const time = now();
      for (const [storedKey, record] of attempts) {
        if (record.expiresAt <= time) attempts.delete(storedKey);
      }
      if (!attempts.has(key) && attempts.size >= 5000) return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
      let current = attempts.get(key);
      if (!current || current.expiresAt <= time) {
        current = { count: 0, expiresAt: time + windowMs };
        attempts.set(key, current);
      }
      if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt - time) / 1000)) };
      current.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

async function checkRateLimit(key, { env, fetchImpl, rateLimiter }) {
  const restUrl = env.UPSTASH_REDIS_REST_URL;
  const restToken = env.UPSTASH_REDIS_REST_TOKEN;
  const production = env.NODE_ENV === "production";
  if (!restUrl && !restToken) {
    if (production) return { configured: false };
    return { configured: true, ...rateLimiter.check(key) };
  }
  if (!restUrl || !restToken) return { configured: false };

  let url;
  try {
    url = new URL(restUrl);
    if (url.protocol !== "https:") return { configured: false };
  } catch {
    return { configured: false };
  }

  const hashedKey = createHash("sha256").update(key).digest("hex");
  const script = "local count=redis.call('INCR',KEYS[1]); if count==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return {count,redis.call('TTL',KEYS[1])}";
  try {
    const response = await (fetchImpl ?? fetch)(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${restToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", script, 1, `contact-rate:${hashedKey}`, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)]),
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return { configured: false };
    const result = await response.json();
    const count = result?.result?.[0];
    const ttl = result?.result?.[1];
    if (!Number.isInteger(count) || !Number.isInteger(ttl)) return { configured: false };
    return { configured: true, allowed: count <= RATE_LIMIT_MAX, retryAfterSeconds: Math.max(1, ttl) };
  } catch {
    return { configured: false };
  }
}

function contactEmailText(value) {
  return [
    "New website project enquiry",
    `Name: ${value.name}`,
    `Email: ${value.email}`,
    `Service: ${value.service}`,
    `Business: ${value.businessName || "Not provided"}`,
    `Budget range: ${value.budgetRange || "Not provided"}`,
    `Timeline: ${value.timeline || "Not provided"}`,
    `Existing website: ${value.existingWebsite || "Not provided"}`,
    `Preferred contact method: ${value.preferredContactMethod || "Not provided"}`,
    "",
    "Project description:",
    value.projectDescription,
  ].join("\n");
}

/** @param {import("./contact-validation.mjs").ContactPayload} value @param {{ env?: Record<string, string | undefined>, fetchImpl?: typeof fetch }} [options] */
export async function sendContactEmail(value, options = {}) {
  const env = options.env ?? process.env;
  const apiKey = env.RESEND_API_KEY;
  const recipient = env.CONTACT_EMAIL_TO;
  const sender = env.CONTACT_EMAIL_FROM;
  if (!apiKey || !recipient || !sender) return { ok: false, reason: "not_configured" };

  try {
    const response = await (options.fetchImpl ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: value.email,
        subject: `New portfolio enquiry: ${value.service}`,
        text: contactEmailText(value),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok ? { ok: true } : { ok: false, reason: "provider_rejected" };
  } catch {
    return { ok: false, reason: "provider_unavailable" };
  }
}

/** @param {{ env?: Record<string, string | undefined>, fetchImpl?: typeof fetch, rateLimiter?: ReturnType<typeof createContactRateLimiter>, now?: () => number }} [dependencies] */
export function createContactHandler(dependencies = {}) {
  const env = dependencies.env ?? process.env;
  const rateLimiter = dependencies.rateLimiter ?? createContactRateLimiter();
  const now = dependencies.now ?? Date.now;

  return async function handleContact(request) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).origin !== new URL(request.url).origin) {
          return Response.json({ message: "This request could not be accepted." }, { status: 403 });
        }
      } catch {
        return Response.json({ message: "This request could not be accepted." }, { status: 403 });
      }
    }

    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return Response.json({ message: "Send the form as JSON." }, { status: 415 });
    }

    const address = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit(address, { env, fetchImpl: dependencies.fetchImpl, rateLimiter });
    if (!limit.configured) {
      return Response.json({ message: "Contact protection is not configured. Please try again later." }, { status: 503 });
    }
    if (!limit.allowed) {
      return Response.json({ message: "Please wait before sending another enquiry." }, {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    let body;
    try {
      body = await readContactJson(request);
    } catch (error) {
      if (error instanceof ContactBodyError && error.reason === "too_large") {
        return Response.json({ message: "The form is too large. Shorten the project description and try again." }, { status: 413 });
      }
      return Response.json({ message: "The request could not be read. Check the form and try again." }, { status: 400 });
    }

    if (body && typeof body === "object" && (body.website || !Number.isFinite(body.startedAt) || now() - body.startedAt < 1800 || now() - body.startedAt > 8 * 60 * 60 * 1000)) {
      return Response.json({ message: "Check the form and try again." }, { status: 400 });
    }

    const result = validateContactPayload(body);
    if (!result.valid) return Response.json({ message: "Please correct the highlighted fields.", errors: result.errors }, { status: 400 });

    const delivery = await sendContactEmail(result.value, { env, fetchImpl: dependencies.fetchImpl });
    if (!delivery.ok && delivery.reason === "not_configured") {
      return Response.json({ message: "Contact delivery is not configured yet. Please try again later." }, { status: 503 });
    }
    if (!delivery.ok) {
      return Response.json({ message: "Your enquiry could not be sent. Please try again later." }, { status: 502 });
    }

    return Response.json({ message: "Your enquiry was sent. Thank you for getting in touch." }, { status: 200 });
  };
}
