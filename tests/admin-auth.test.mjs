import test from "node:test";
import assert from "node:assert/strict";
import { checkAndRecordLoginAttempt, clearLocalLoginAttempts } from "../src/lib/auth/rate-limit.mjs";
import { getAdminIdentity, isAuthEnvironmentConfigured, registrationDisabled } from "../src/lib/auth/access-policy.mjs";
import { validateLoginRequest } from "../src/lib/auth/login-request.mjs";
import { hashPassword, verifyPassword } from "../src/lib/auth/password.mjs";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";

test("admin identity rejects missing sessions and returns only public identity fields", () => {
  assert.equal(getAdminIdentity(null), null);
  assert.equal(getAdminIdentity({ user: { id: "a" } }), null);
  assert.deepEqual(getAdminIdentity({ user: { id: "a", email: "admin@example.test", name: "Admin", image: "private" } }), {
    id: "a",
    email: "admin@example.test",
  });
});

test("registration stays disabled", () => {
  assert.equal(registrationDisabled, true);
});

test("production auth requires a long secret and an HTTPS origin", () => {
  const common = { NODE_ENV: "production", BETTER_AUTH_SECRET: "a".repeat(32), BETTER_AUTH_URL: "https://portfolio.example.test" };
  assert.equal(isAuthEnvironmentConfigured(common), true);
  assert.equal(isAuthEnvironmentConfigured({ ...common, BETTER_AUTH_SECRET: "too-short" }), false);
  assert.equal(isAuthEnvironmentConfigured({ ...common, BETTER_AUTH_URL: "http://portfolio.example.test" }), false);
  assert.equal(isAuthEnvironmentConfigured({ ...common, BETTER_AUTH_URL: "https://portfolio.example.test/path" }), false);
});

test("login request requires email and password and validates email", async () => {
  assert.deepEqual(await validateLoginRequest(new Request("https://example.test", { method: "POST", body: "{}" })), { ok: false, status: 400 });
  assert.deepEqual(await validateLoginRequest(new Request("https://example.test", { method: "POST", body: JSON.stringify({ email: "not-email", password: "secret" }) })), { ok: false, status: 400 });
  assert.equal((await validateLoginRequest(new Request("https://example.test", { method: "POST", body: JSON.stringify({ email: "admin@example.test", password: "x" }) }))).ok, true);
});

test("login request rejects malformed and oversized payloads", async () => {
  assert.deepEqual(await validateLoginRequest(new Request("https://example.test", { method: "POST", headers: { "content-type": "application/json" }, body: "{" })), { ok: false, status: 400 });
  assert.deepEqual(await validateLoginRequest(new Request("https://example.test", { method: "POST", headers: { "content-length": "9000" }, body: "{}" })), { ok: false, status: 413 });
});

test("local sign-in limiter allows ten attempts and rejects the next", async () => {
  clearLocalLoginAttempts();
  const request = new Request("https://example.test/api/auth/sign-in/email", { headers: { "x-real-ip": "192.0.2.10" } });
  for (let index = 0; index < 10; index += 1) {
    assert.equal((await checkAndRecordLoginAttempt(request, { env: { NODE_ENV: "test" } })).allowed, true);
  }
  assert.equal((await checkAndRecordLoginAttempt(request, { env: { NODE_ENV: "test" } })).allowed, false);
  clearLocalLoginAttempts();
});

test("production limiter fails closed without Redis configuration", async () => {
  const request = new Request("https://example.test/api/auth/sign-in/email");
  assert.deepEqual(
    await checkAndRecordLoginAttempt(request, { env: { NODE_ENV: "production" } }),
    { allowed: false, reason: "configuration" },
  );
});

test("production limiter fails closed when Redis is unavailable", async () => {
  const request = new Request("https://example.test/api/auth/sign-in/email");
  const result = await checkAndRecordLoginAttempt(request, {
    env: { NODE_ENV: "production", UPSTASH_REDIS_REST_URL: "https://redis.example.test", UPSTASH_REDIS_REST_TOKEN: "test-token" },
    fetchImpl: async () => new Response(null, { status: 500 }),
  });
  assert.deepEqual(result, { allowed: false, reason: "unavailable" });
});

test("production limiter accepts a Redis count within the limit", async () => {
  const request = new Request("https://example.test/api/auth/sign-in/email", { headers: { "x-real-ip": "192.0.2.11" } });
  let sentBody;
  const result = await checkAndRecordLoginAttempt(request, {
    env: { NODE_ENV: "production", UPSTASH_REDIS_REST_URL: "https://redis.example.test", UPSTASH_REDIS_REST_TOKEN: "test-token" },
    fetchImpl: async (_url, options) => {
      sentBody = JSON.parse(options.body);
      return Response.json({ result: 4 });
    },
  });
  assert.deepEqual(result, { allowed: true });
  assert.equal(sentBody[0], "EVAL");
  assert.match(sentBody[3], /^admin-login:[a-f0-9]{64}$/);
});

test("Argon2id password hashes verify only the matching password", async () => {
  const password = "correct horse battery staple";
  const hash = await hashPassword(password);
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await verifyPassword({ hash, password }), true);
  assert.equal(await verifyPassword({ hash, password: "incorrect password" }), false);
});

test("credentials sign-in, generic invalid-password failure, session and logout work", async () => {
  const auth = betterAuth({
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    secret: "test-only-secret-that-is-long-enough-for-better-auth",
    baseURL: "http://localhost:3000",
    rateLimit: { enabled: false },
    emailAndPassword: { enabled: true },
  });
  const send = (path, { method = "POST", body, cookie } = {}) => auth.handler(new Request(`http://localhost:3000/api/auth${path}`, {
    method,
    headers: {
      origin: "http://localhost:3000",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));

  const signup = await send("/sign-up/email", { body: { name: "Admin", email: "owner@example.test", password: "long-enough-test-password" } });
  assert.equal(signup.status, 200);
  const invalid = await send("/sign-in/email", { body: { email: "owner@example.test", password: "wrong-password" } });
  assert.equal(invalid.status, 401);
  const invalidBody = await invalid.json();
  assert.match(invalidBody.message, /invalid email or password/i);

  const signedIn = await send("/sign-in/email", { body: { email: "owner@example.test", password: "long-enough-test-password" } });
  assert.equal(signedIn.status, 200);
  const setCookies = signedIn.headers.getSetCookie();
  assert.ok(setCookies.length);
  const cookie = setCookies.map((part) => part.split(";")[0]).join("; ");
  const session = await send("/get-session", { method: "GET", cookie });
  assert.equal(session.status, 200);
  assert.equal((await session.json()).user.email, "owner@example.test");

  const loggedOut = await send("/sign-out", { cookie });
  assert.equal(loggedOut.status, 200);
  const afterLogout = await send("/get-session", { method: "GET", cookie });
  assert.equal(await afterLogout.json(), null);
});

test("Better Auth rejects public registration when disabled", async () => {
  const auth = betterAuth({
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    secret: "test-only-secret-that-is-long-enough-for-better-auth",
    baseURL: "http://localhost:3000",
    emailAndPassword: { enabled: true, disableSignUp: true },
  });
  const response = await auth.handler(new Request("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Anyone", email: "anyone@example.test", password: "long-enough-test-password" }),
  }));
  assert.equal(response.status, 400);
});
