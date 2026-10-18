import test from "node:test";
import assert from "node:assert/strict";
import { createMediaHandlers, createMediaRateLimiter, MEDIA_MAX_BYTES } from "../src/lib/cms/media-service.mjs";
import { createCaseStudy } from "../src/lib/cms/case-studies.mjs";

const env = { NODE_ENV: "test", NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "demo-cloud", NEXT_PUBLIC_CLOUDINARY_API_KEY: "public-key", CLOUDINARY_API_SECRET: "test-secret", CLOUDINARY_UPLOAD_PRESET: "portfolio-signed" };
const publicId = "portfolio-cms/123e4567-e89b-42d3-a456-426614174000";
const remote = (overrides = {}) => {
  const asset = { public_id: publicId, resource_type: "image", type: "upload", asset_folder: "portfolio-cms", format: "webp", width: 1200, height: 800, bytes: 50_000, asset_id: "cloudinary-asset-id", created_at: "2026-10-18T18:25:47Z", ...overrides };
  return { secure_url: `https://res.cloudinary.com/demo-cloud/image/upload/${publicId}.${asset.format}`, ...asset };
};
const jsonRequest = (url, body, method = "POST") => new Request(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

function fixture({ authorized = true, response = remote(), createError, references = [0, 0, 0], assets = [] } = {}) {
  const calls = { signature: [], created: [], updated: [], deleted: 0, requested: [] };
  const db = {
    mediaAsset: {
      findMany: async ({ where }) => { calls.requested.push(where); return assets; },
      count: async () => assets.length,
      findUnique: async ({ where }) => assets.find((asset) => asset.providerId === where.providerId) ?? null,
      create: async ({ data }) => { if (createError) throw createError; const value = { id: "asset-1", ...data }; calls.created.push(value); return value; },
      update: async ({ where, data }) => { const value = { id: where.id, ...data, secureUrl: remote().secure_url, providerId: publicId }; calls.updated.push(value); return value; },
      delete: async ({ where }) => { calls.deleted += 1; return { id: where.id }; },
    },
    project: { count: async () => references[0] },
    blogPost: { count: async () => references[1] },
    caseStudyImage: { count: async () => references[2] },
  };
  const cloudinary = {
    utils: { api_sign_request: (params, secret) => { calls.signature.push({ params, secret }); return "signature"; } },
    api: { resource: async (id, options) => { calls.requested.push({ id, options }); return response; } },
  };
  return { calls, db, handlers: createMediaHandlers({ authorize: async () => authorized ? { ok: true } : Response.json({}, { status: 401 }), db, cloudinary, env, rateLimit: async () => true, now: () => 1770000000, createId: () => "123e4567-e89b-42d3-a456-426614174000" }) };
}

test("signature requests require admin authorization", async () => {
  const { handlers, calls } = fixture({ authorized: false });
  const response = await handlers.signature(new Request("https://site.test/api/admin/media/signature", { method: "POST" }));
  assert.equal(response.status, 401);
  assert.equal(calls.signature.length, 0);
});

test("signature is generated only for the server-controlled image parameters", async () => {
  const { handlers, calls } = fixture();
  const response = await handlers.signature(jsonRequest("https://site.test/api/admin/media/signature", { folder: "elsewhere", resource_type: "raw", timestamp: 1 }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.cloudName, "demo-cloud");
  assert.equal(body.data.apiKey, "public-key");
  assert.equal(calls.signature[0].secret, "test-secret");
  assert.deepEqual(calls.signature[0].params, { folder: "portfolio-cms", public_id: "123e4567-e89b-42d3-a456-426614174000", timestamp: 1770000000, upload_preset: "portfolio-signed", allowed_formats: "jpg,jpeg,png,webp,avif", overwrite: false, unique_filename: false });
});

test("production signature limiting fails closed when Redis is unavailable", async () => {
  const limiter = createMediaRateLimiter({ env: { NODE_ENV: "production", UPSTASH_REDIS_REST_URL: "https://redis.test", UPSTASH_REDIS_REST_TOKEN: "token" }, fetchImpl: async () => new Response("", { status: 500 }) });
  assert.equal(await limiter(new Request("https://site.test", { headers: { "x-real-ip": "192.0.2.1" } })), false);
  const fixtureHandlers = createMediaHandlers({ authorize: async () => ({ ok: true }), db: {}, cloudinary: {}, env, rateLimit: async () => false });
  assert.equal((await fixtureHandlers.signature(new Request("https://site.test", { method: "POST" }))).status, 429);
});

test("valid Cloudinary Admin API assets in each supported format persist", async (t) => {
  for (const format of ["png", "jpg", "jpeg", "webp", "avif"]) {
    await t.test(format, async () => {
      const image = remote({ format, bytes: 8_625, asset_folder: "portfolio-cms", ...(format === "png" ? { folder: null, created_at: "2026-10-18T18:25:47Z", asset_id: "verified-cloudinary-asset" } : {}) });
      const { handlers, calls } = fixture({ response: image });
      const response = await handlers.persist(jsonRequest("https://site.test/api/admin/media", { publicId, altText: "Approved image" }));
      assert.equal(response.status, 201);
      assert.equal(calls.created[0].format, format);
      assert.equal(calls.created[0].secureUrl, image.secure_url);
    });
  }
});

test("Cloudinary response is independently checked for folder, format, ownership and size", async (t) => {
  for (const [name, change] of [
    ["resource type", { resource_type: "video" }],
    ["delivery type", { type: "private" }],
    ["asset folder", { asset_folder: "another-folder" }],
    ["missing asset folder", { asset_folder: undefined }],
    ["format", { format: "svg" }],
    ["delivery URL", { secure_url: "https://attacker.test/file.webp" }],
    ["file size", { bytes: MEDIA_MAX_BYTES + 1 }],
    ["empty file", { bytes: 0 }],
    ["public ID", { public_id: "portfolio-cms/someone-elses-id" }],
  ]) {
    await t.test(name, async () => {
      const { handlers, calls } = fixture({ response: remote(change) });
      const response = await handlers.persist(jsonRequest("https://site.test/api/admin/media", { publicId, altText: "Approved image" }));
      assert.equal(response.status, 400);
      assert.equal(calls.created.length, 0);
    });
  }
});

test("persist rejects client-supplied URLs and stores only independently verified Cloudinary metadata", async () => {
  const { handlers, calls } = fixture();
  const forged = await handlers.persist(jsonRequest("https://site.test/api/admin/media", { publicId, altText: "An image", secureUrl: "https://evil.test/image.jpg" }));
  assert.equal(forged.status, 400);
  const response = await handlers.persist(jsonRequest("https://site.test/api/admin/media", { publicId, altText: "An image" }));
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.data.secureUrl, remote().secure_url);
  assert.equal(body.data.providerId, publicId);
  assert.equal(calls.created[0].provider, "cloudinary");
  assert.equal(calls.created[0].width, 1200);
});

test("media persistence requires admin authorization and reports existing assets without creating duplicates", async () => {
  const asset = { id: "asset-1", providerId: publicId, secureUrl: remote().secure_url, altText: "Saved image", width: 1200, height: 800, format: "webp" };
  const denied = fixture({ authorized: false });
  assert.equal((await denied.handlers.persist(jsonRequest("https://site.test/api/admin/media", { publicId, altText: "Image" }))).status, 401);
  assert.equal(denied.calls.created.length, 0);

  const duplicate = fixture({ assets: [asset] });
  const response = await duplicate.handlers.persist(jsonRequest("https://site.test/api/admin/media", { publicId, altText: "Image" }));
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, "MEDIA_EXISTS");
  assert.equal(duplicate.calls.created.length, 0);
});

test("database persistence failures are safe and do not report success", async () => {
  const { handlers } = fixture({ createError: new Error("private database detail") });
  const response = await handlers.persist(jsonRequest("https://site.test/api/admin/media", { publicId, altText: "An image" }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.message.includes("private database detail"), false);
});

test("existing assets are selectable and referenced assets cannot be removed", async () => {
  const asset = { id: "asset-1", providerId: publicId, secureUrl: remote().secure_url, altText: "A saved image", width: 1200, height: 800, format: "webp" };
  const { handlers, calls } = fixture({ assets: [asset], references: [0, 0, 1] });
  const listing = await handlers.list(new Request("https://site.test/api/admin/media?q=saved"));
  assert.equal((await listing.json()).data[0].id, "asset-1");
  assert.equal(calls.requested[0].provider, "cloudinary");
  const response = await handlers.remove(new Request("https://site.test/api/admin/media/asset-1", { method: "DELETE" }), "asset-1");
  assert.equal(response.status, 409);
  assert.equal(calls.deleted, 0);
});

test("case-study CRUD payloads link the selected screenshot IDs", async () => {
  let captured;
  const db = {
    $transaction: (work) => work({
      project: { findUnique: async () => ({ id: "project-1" }) },
      mediaAsset: { findMany: async () => [{ id: "media-1" }, { id: "media-2" }] },
      caseStudy: { create: async ({ data }) => { captured = data; return data; } },
    }),
  };
  await createCaseStudy(db, { slug: "sample-case", projectId: "project-1", mediaAssetIds: ["media-1", "media-2"] });
  assert.deepEqual(captured.screenshots.create.map((row) => [row.mediaAsset.connect.id, row.sortOrder]), [["media-1", 0], ["media-2", 1]]);
});
