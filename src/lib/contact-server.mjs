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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function contactEmailHtml(value) {
  return [
    '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">',
    '  <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px; border-bottom: 1px solid #e5e5e5; padding-bottom: 12px;">New Project Enquiry</h2>',
    '  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">',
    `    <tr><td style="padding: 8px 0; font-weight: 600; width: 140px; color: #666;">Name</td><td style="padding: 8px 0;">${escapeHtml(value.name)}</td></tr>`,
    `    <tr><td style="padding: 8px 0; font-weight: 600; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(value.email)}">${escapeHtml(value.email)}</a></td></tr>`,
    `    <tr><td style="padding: 8px 0; font-weight: 600; color: #666;">Service</td><td style="padding: 8px 0;">${escapeHtml(value.service)}</td></tr>`,
    `    <tr><td style="padding: 8px 0; font-weight: 600; color: #666;">Business</td><td style="padding: 8px 0;">${escapeHtml(value.businessName || "Not provided")}</td></tr>`,
    `    <tr><td style="padding: 8px 0; font-weight: 600; color: #666;">Budget range</td><td style="padding: 8px 0;">${escapeHtml(value.budgetRange || "Not provided")}</td></tr>`,
    `    <tr><td style="padding: 8px 0; font-weight: 600; color: #666;">Timeline</td><td style="padding: 8px 0;">${escapeHtml(value.timeline || "Not provided")}</td></tr>`,
    `    <tr><td style="padding: 8px 0; font-weight: 600; color: #666;">Existing website</td><td style="padding: 8px 0;">${value.existingWebsite ? `<a href="${escapeHtml(value.existingWebsite)}">${escapeHtml(value.existingWebsite)}</a>` : "Not provided"}</td></tr>`,
    `    <tr><td style="padding: 8px 0; font-weight: 600; color: #666;">Preferred contact</td><td style="padding: 8px 0;">${escapeHtml(value.preferredContactMethod || "Not provided")}</td></tr>`,
    '  </table>',
    '  <div style="background: #f9f9f9; border-left: 3px solid #111; padding: 16px; margin-top: 16px; border-radius: 4px;">',
    '    <h3 style="font-size: 13px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em; color: #666;">Project Description</h3>',
    `    <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${escapeHtml(value.projectDescription)}</p>`,
    '  </div>',
    '</div>',
  ].join("\n");
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
  const recipient = env.CONTACT_EMAIL_TO || "ajmot123.hossain@gmail.com";
  const sender = env.CONTACT_EMAIL_FROM || "onboarding@resend.dev";
  if (!apiKey || !recipient || !sender) return { ok: false, reason: "not_configured" };

  try {
    const response = await (options.fetchImpl ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: value.email,
        subject: `New portfolio enquiry: ${value.service} (${value.name})`,
        text: contactEmailText(value),
        html: contactEmailHtml(value),
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
