import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateContactPayload } from "../src/lib/contact-validation.mjs";
import { createContactHandler, createContactRateLimiter } from "../src/lib/contact-server.mjs";
import { getBlogCanonical, getBlogPostBySlug, getBlogPosts } from "../src/lib/blog.mjs";
import { findPublishedBlogPost, getPublishedBlogPosts, parseBlogPost } from "../src/lib/blog-post.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blogFixtures = path.join(root, "tests", "fixtures", "blog");
const now = () => Date.parse("2026-10-17T12:00:00Z");

function validSubmission(overrides = {}) {
  return {
    name: "Test sender",
    email: "sender@example.test",
    service: "business-website",
    projectDescription: "A test description for an enquiry.",
    businessName: "",
    budgetRange: "",
    timeline: "",
    existingWebsite: "",
    preferredContactMethod: "",
    website: "",
    startedAt: now() - 5000,
    ...overrides,
  };
}

function makeRequest(body, { ip = "192.0.2.10", raw = false } = {}) {
  return new Request("https://portfolio.example/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://portfolio.example",
      "x-real-ip": ip,
    },
    body: raw ? body : JSON.stringify(body),
  });
}

const configuredEnv = {
  NODE_ENV: "test",
  RESEND_API_KEY: "test-provider-key",
  CONTACT_EMAIL_TO: "test-recipient@example.test",
  CONTACT_EMAIL_FROM: "test-sender@example.test",
};

test("contact validation requires all core fields and rejects invalid email", () => {
  const missing = validateContactPayload({});
  assert.equal(missing.valid, false);
  if (!missing.valid) {
    assert.ok(missing.errors.name);
    assert.ok(missing.errors.email);
    assert.ok(missing.errors.service);
    assert.ok(missing.errors.projectDescription);
  }

  const invalidEmail = validateContactPayload({ ...validSubmission(), email: "not-an-email" });
  assert.equal(invalidEmail.valid, false);
  if (!invalidEmail.valid) assert.match(invalidEmail.errors.email, /valid email/i);
});

test("contact handler rejects malformed and oversized request bodies", async () => {
  const handler = createContactHandler({ env: configuredEnv, now, fetchImpl: async () => new Response("{}") });
  const malformed = await handler(makeRequest("{" , { raw: true }));
  assert.equal(malformed.status, 400);

  const oversized = await handler(makeRequest("x".repeat(12_001), { raw: true }));
  assert.equal(oversized.status, 413);
});

test("contact handler returns failure when delivery is not configured", async () => {
  const handler = createContactHandler({ env: { NODE_ENV: "test" }, now });
  const response = await handler(makeRequest(validSubmission()));
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /not configured/i);
});

test("provider rejection is reported as failure, never as success", async () => {
  const handler = createContactHandler({
    env: configuredEnv,
    now,
    fetchImpl: async () => new Response(JSON.stringify({ message: "Rejected" }), { status: 422 }),
  });
  const response = await handler(makeRequest(validSubmission()));
  assert.equal(response.status, 502);
  assert.match((await response.json()).message, /could not be sent/i);
});

test("provider acceptance returns success and sends to the configured recipient", async () => {
  let sentRequest;
  const handler = createContactHandler({
    env: configuredEnv,
    now,
    fetchImpl: async (url, options) => {
      sentRequest = { url: String(url), options };
      return new Response(JSON.stringify({ id: "test-message-id" }), { status: 200 });
    },
  });
  const response = await handler(makeRequest(validSubmission()));
  assert.equal(response.status, 200);
  assert.match((await response.json()).message, /was sent/i);
  assert.equal(sentRequest.url, "https://api.resend.com/emails");
  assert.equal(JSON.parse(sentRequest.options.body).to[0], configuredEnv.CONTACT_EMAIL_TO);
});

test("contact handler applies the rate limit and rejects spam honeypot submissions", async () => {
  let deliveries = 0;
  const rateLimiter = createContactRateLimiter({ limit: 1, windowMs: 60_000, now });
  const handler = createContactHandler({
    env: configuredEnv,
    now,
    rateLimiter,
    fetchImpl: async () => { deliveries += 1; return new Response("{}", { status: 200 }); },
  });
  const first = await handler(makeRequest(validSubmission()));
  const second = await handler(makeRequest(validSubmission()));
  assert.equal(first.status, 200);
  assert.equal(second.status, 429);
  assert.equal(deliveries, 1);

  const honeypotHandler = createContactHandler({ env: configuredEnv, now, fetchImpl: async () => new Response("{}") });
  const spam = await honeypotHandler(makeRequest(validSubmission({ website: "spam" }), { ip: "192.0.2.11" }));
  assert.equal(spam.status, 400);
});

test("production contact requests use the configured distributed limiter and fail closed without it", async () => {
  let redisCount = 0;
  let deliveries = 0;
  const productionEnv = {
    ...configuredEnv,
    NODE_ENV: "production",
    UPSTASH_REDIS_REST_URL: "https://redis.example.test/",
    UPSTASH_REDIS_REST_TOKEN: "test-redis-token",
  };
  const handler = createContactHandler({
    env: productionEnv,
    now,
    fetchImpl: async (url) => {
      if (String(url) === productionEnv.UPSTASH_REDIS_REST_URL) {
        redisCount += 1;
        return Response.json({ result: [redisCount, 3600] });
      }
      deliveries += 1;
      return Response.json({ id: "test-message-id" });
    },
  });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await handler(makeRequest(validSubmission()))).status, 200);
  }
  assert.equal((await handler(makeRequest(validSubmission()))).status, 429);
  assert.equal(redisCount, 6);
  assert.equal(deliveries, 5);

  const noProductionLimiter = createContactHandler({ env: { ...configuredEnv, NODE_ENV: "production" }, now });
  assert.equal((await noProductionLimiter(makeRequest(validSubmission()))).status, 503);
});

test("contact, blog, and privacy routes are connected to the shared site navigation", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const route of [
    "src/app/api/contact/route.ts",
    "src/app/contact/page.tsx",
    "src/app/privacy/page.tsx",
    "src/app/blog/page.tsx",
    "src/app/blog/[slug]/page.tsx",
  ]) {
    const source = await readFile(path.join(root, route), "utf8");
    assert.ok(source.length > 0, `${route} should exist`);
  }
  const navigation = await readFile(path.join(root, "src/content/site.ts"), "utf8");
  assert.match(navigation, /label: "Blog", href: "\/blog"/);
  assert.match(navigation, /label: "Contact", href: "\/contact"/);
  const articleRoute = await readFile(path.join(root, "src/app/blog/[slug]/page.tsx"), "utf8");
  assert.match(articleRoute, /if \(!post\) notFound\(\)/);
});

test("blog listing includes published Markdown only and renders the article body", () => {
  const fixtures = fs.readdirSync(blogFixtures)
    .filter((name) => name.endsWith(".md"))
    .map((name) => parseBlogPost(fs.readFileSync(path.join(blogFixtures, name), "utf8"), name));
  const posts = getPublishedBlogPosts(fixtures);
  assert.deepEqual(posts.map(({ slug }) => slug), ["published-sample"]);
  const post = findPublishedBlogPost("published-sample", fixtures);
  assert.ok(post);
  assert.match(post.contentHtml, /<h2>Article body fixture<\/h2>/);
  assert.match(post.contentHtml, /This text is used only to verify Markdown rendering/);
  assert.doesNotMatch(post.contentHtml, /<script/i);
  assert.doesNotMatch(post.contentHtml, /href="javascript:/i);
  assert.equal(getBlogCanonical(post.slug, "https://portfolio.example"), "https://portfolio.example/blog/published-sample");
  assert.equal(getBlogCanonical(post.slug, ""), undefined);
});

test("blog lookup hides drafts and returns no result for missing or invalid slugs", () => {
  const fixtures = fs.readdirSync(blogFixtures)
    .filter((name) => name.endsWith(".md"))
    .map((name) => parseBlogPost(fs.readFileSync(path.join(blogFixtures, name), "utf8"), name));
  assert.equal(findPublishedBlogPost("draft-sample", fixtures), undefined);
  assert.equal(findPublishedBlogPost("missing", fixtures), undefined);
  assert.equal(findPublishedBlogPost("../draft-sample", fixtures), undefined);
  assert.equal(getBlogPostBySlug("draft-sample"), undefined);
  assert.equal(getBlogPostBySlug("../draft-sample"), undefined);
  assert.deepEqual(getBlogPosts(), []);
});
