import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/config";
import { checkAndRecordLoginAttempt } from "@/lib/auth/rate-limit.mjs";
import { isAuthEnvironmentConfigured, registrationDisabled } from "@/lib/auth/access-policy.mjs";
import { validateLoginRequest } from "@/lib/auth/login-request.mjs";

export const runtime = "nodejs";
const authHandlers = toNextJsHandler(auth);

export async function GET(request: Request) {
  if (!isAuthEnvironmentConfigured()) {
    return Response.json({ message: "Authentication is not configured." }, { status: 503 });
  }
  return authHandlers.GET(request);
}

export async function POST(request: Request) {
  if (!isAuthEnvironmentConfigured()) {
    return Response.json({ message: "Authentication is not configured." }, { status: 503 });
  }

  const path = new URL(request.url).pathname;
  if (registrationDisabled && (path.includes("/sign-up/") || path.endsWith("/sign-up"))) {
    return new Response(null, { status: 404 });
  }

  let validatedRequest = request;
  if (path.endsWith("/sign-in/email")) {
    const validation = await validateLoginRequest(request);
    if (!validation.ok) {
      return Response.json({ message: "Enter a valid email and password." }, { status: validation.status });
    }
    const limit = await checkAndRecordLoginAttempt(request);
    if (!limit.allowed) {
      const status = limit.reason ? 503 : 429;
      return Response.json(
        { message: status === 429 ? "Too many sign-in attempts. Try again later." : "Authentication is temporarily unavailable." },
        { status, headers: { "retry-after": "900", "cache-control": "no-store" } },
      );
    }
    validatedRequest = new Request(request.url, { method: "POST", headers: request.headers, body: validation.body });
  }

  return authHandlers.POST(validatedRequest);
}
