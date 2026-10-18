import type { ContactPayload } from "./contact-validation.mjs";

export const MAX_CONTACT_BODY_BYTES: number;
export class ContactBodyError extends Error {
  reason: "too_large" | "malformed";
}
export function readContactJson(request: Request, maximumBytes?: number): Promise<unknown>;
export function createContactRateLimiter(options?: { limit?: number; windowMs?: number; now?: () => number }): {
  check(key: string): { allowed: boolean; retryAfterSeconds: number };
};
export function sendContactEmail(
  value: ContactPayload,
  options?: { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch },
): Promise<{ ok: true } | { ok: false; reason: "not_configured" | "provider_rejected" | "provider_unavailable" }>;
export function createContactHandler(dependencies?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  rateLimiter?: ReturnType<typeof createContactRateLimiter>;
  now?: () => number;
}): (request: Request) => Promise<Response>;
