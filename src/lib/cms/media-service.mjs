import { randomUUID, createHash } from "node:crypto";
import { ApiError, readJson } from "./validation.mjs";

export const MEDIA_MAX_BYTES = 8 * 1024 * 1024;
export const MEDIA_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"];
const folder = "portfolio-cms";
const assetSelect = { id: true, secureUrl: true, altText: true, width: true, height: true, format: true, providerId: true };
const validAssetId = /^[A-Za-z0-9_-]{1,128}$/;

function jsonError(status, code, message) {
  return Response.json({ error: { code, message } }, { status, headers: { "cache-control": "no-store" } });
}

function safeAsset(asset) {
  return { id: asset.id, secureUrl: asset.secureUrl, altText: asset.altText, width: asset.width, height: asset.height, format: asset.format, providerId: asset.providerId };
}

export function createMediaRateLimiter({ env = process.env, fetchImpl = fetch, now = Date.now, limit = 15, windowSeconds = 900 } = {}) {
  const local = new Map();
  return async function check(request) {
    const address = request.headers.get("x-real-ip") || "unknown";
    const key = `cms-media-sign:${createHash("sha256").update(address).digest("hex")}`;
    if (env.NODE_ENV === "production") {
      if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return false;
      try {
        const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return n";
        const response = await fetchImpl(env.UPSTASH_REDIS_REST_URL, { method: "POST", headers: { authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "content-type": "application/json" }, body: JSON.stringify(["EVAL", script, 1, key, windowSeconds]), cache: "no-store" });
        if (!response.ok) return false;
        const count = Number((await response.json()).result);
        return Number.isFinite(count) && count <= limit;
      } catch { return false; }
    }
    const time = now();
    const old = local.get(key);
    const next = old && old.expiresAt > time ? { count: old.count + 1, expiresAt: old.expiresAt } : { count: 1, expiresAt: time + windowSeconds * 1000 };
    local.set(key, next);
    return next.count <= limit;
  };
}

function getUploadConfig(env) {
  const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  const uploadPreset = env.CLOUDINARY_UPLOAD_PRESET;
  if (![cloudName, apiKey, apiSecret, uploadPreset].every((value) => typeof value === "string" && value.length > 0)) {
    throw new ApiError(503, "MEDIA_UNAVAILABLE", "Image uploads are not configured yet.");
  }
  return { cloudName, apiKey, apiSecret, uploadPreset };
}

export function createMediaHandlers({ authorize, db, cloudinary, env = process.env, rateLimit, now = () => Math.floor(Date.now() / 1000), createId = randomUUID }) {
  async function authorized(request) {
    const auth = await authorize(request);
    if (auth instanceof Response) return auth;
    return null;
  }
  async function signature(request) {
    const denied = await authorized(request);
    if (denied) return denied;
    const announced = Number(request.headers.get("content-length"));
    if (Number.isFinite(announced) && announced > 0) return jsonError(400, "INVALID_REQUEST", "The signature request must not include upload parameters or file data.");
    if (!rateLimit || !(await rateLimit(request))) return jsonError(429, "RATE_LIMITED", "Too many upload requests. Try again later.");
    try {
      const config = getUploadConfig(env);
      const timestamp = now();
      const publicId = createId();
      const uploadParams = { folder, public_id: publicId, timestamp, upload_preset: config.uploadPreset, allowed_formats: MEDIA_FORMATS.join(","), overwrite: false, unique_filename: false };
      const signature = cloudinary.utils.api_sign_request(uploadParams, config.apiSecret);
      return Response.json({ data: { cloudName: config.cloudName, apiKey: config.apiKey, timestamp, signature, uploadParams } }, { headers: { "cache-control": "no-store" } });
    } catch (error) {
      if (error instanceof ApiError) return jsonError(error.status, error.code, error.message);
      return jsonError(503, "MEDIA_UNAVAILABLE", "Image uploads are not available right now.");
    }
  }
  async function list(request) {
    const denied = await authorized(request);
    if (denied) return denied;
    const url = new URL(request.url);
    const pageRaw = url.searchParams.get("page") ?? "1";
    const pageSizeRaw = url.searchParams.get("pageSize") ?? "24";
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
    if (!/^\d+$/.test(pageRaw) || !/^\d+$/.test(pageSizeRaw)) return jsonError(400, "INVALID_QUERY", "The media query is invalid.");
    const page = Math.max(1, Math.min(10000, Number(pageRaw)));
    const pageSize = Math.max(1, Math.min(100, Number(pageSizeRaw)));
    const where = { provider: "cloudinary", ...(q ? { OR: [{ providerId: { contains: q, mode: "insensitive" } }, { altText: { contains: q, mode: "insensitive" } }] } : {}) };
    try {
      const [assets, total] = await Promise.all([db.mediaAsset.findMany({ where, select: assetSelect, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), db.mediaAsset.count({ where })]);
      return Response.json({ data: assets.map(safeAsset), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }, { headers: { "cache-control": "no-store" } });
    } catch { return jsonError(503, "MEDIA_UNAVAILABLE", "The media library is temporarily unavailable."); }
  }
  async function persist(request) {
    const denied = await authorized(request);
    if (denied) return denied;
    try {
      const body = await readJson(request);
      if (!body || typeof body !== "object" || Object.keys(body).some((key) => !["publicId", "altText"].includes(key)) || typeof body.publicId !== "string" || !/^portfolio-cms\/[a-f0-9-]{36}$/.test(body.publicId) || typeof body.altText !== "string" || body.altText.trim().length < 1 || body.altText.trim().length > 300) {
        return jsonError(400, "VALIDATION_ERROR", "Provide a valid uploaded image and alt text.");
      }
      getUploadConfig(env);
      let remote;
      try { remote = await cloudinary.api.resource(body.publicId, { resource_type: "image" }); }
      catch { return jsonError(400, "UPLOAD_NOT_VERIFIED", "Cloudinary could not verify this uploaded image."); }
      const allowedUrl = typeof remote.secure_url === "string" && (() => { try { const u = new URL(remote.secure_url); return u.protocol === "https:" && u.hostname === "res.cloudinary.com"; } catch { return false; } })();
      if (remote.public_id !== body.publicId || remote.resource_type !== "image" || remote.type !== "upload" || remote.asset_folder !== folder || !allowedUrl || !MEDIA_FORMATS.includes(String(remote.format).toLowerCase()) || !Number.isInteger(remote.width) || remote.width < 1 || !Number.isInteger(remote.height) || remote.height < 1 || !Number.isInteger(remote.bytes) || remote.bytes < 1 || remote.bytes > MEDIA_MAX_BYTES) {
        return jsonError(400, "UPLOAD_NOT_VERIFIED", "The Cloudinary image does not meet the allowed media requirements.");
      }
      const existing = await db.mediaAsset.findUnique({ where: { providerId: body.publicId }, select: assetSelect });
      if (existing) return jsonError(409, "MEDIA_EXISTS", "This image is already in the media library. Select the existing asset.");
      const asset = await db.mediaAsset.create({ data: { provider: "cloudinary", providerId: body.publicId, secureUrl: remote.secure_url, altText: body.altText.trim(), width: remote.width, height: remote.height, format: String(remote.format).toLowerCase() }, select: assetSelect });
      return Response.json({ data: safeAsset(asset) }, { status: 201, headers: { "cache-control": "no-store" } });
    } catch (error) {
      if (error instanceof ApiError) return jsonError(error.status, error.code, error.message);
      if (error?.code === "P2002") return jsonError(409, "MEDIA_EXISTS", "This image is already in the media library. Select the existing asset.");
      return jsonError(503, "MEDIA_PERSISTENCE_FAILED", "The image could not be saved to the media library. The Cloudinary upload may need manual cleanup.");
    }
  }
  async function update(request, id) {
    const denied = await authorized(request);
    if (denied) return denied;
    try {
      const body = await readJson(request);
      if (!validAssetId.test(id) || !body || Object.keys(body).length !== 1 || typeof body.altText !== "string" || body.altText.trim().length < 1 || body.altText.trim().length > 300) return jsonError(400, "VALIDATION_ERROR", "Alt text must be 1 to 300 characters.");
      const asset = await db.mediaAsset.update({ where: { id }, data: { altText: body.altText.trim() }, select: assetSelect });
      return Response.json({ data: safeAsset(asset) }, { headers: { "cache-control": "no-store" } });
    } catch (error) {
      if (error instanceof ApiError) return jsonError(error.status, error.code, error.message);
      if (error?.code === "P2025") return jsonError(404, "NOT_FOUND", "The media asset was not found.");
      return jsonError(503, "MEDIA_UNAVAILABLE", "The media asset could not be updated.");
    }
  }
  async function remove(request, id) {
    const denied = await authorized(request);
    if (denied) return denied;
    if (!validAssetId.test(id)) return jsonError(400, "INVALID_ID", "The media asset ID is invalid.");
    try {
      const [projects, posts, screenshots] = await Promise.all([
        db.project.count({ where: { coverImageId: id } }), db.blogPost.count({ where: { coverImageId: id } }), db.caseStudyImage.count({ where: { mediaAssetId: id } }),
      ]);
      if (projects + posts + screenshots > 0) return jsonError(409, "MEDIA_IN_USE", "This image is assigned to content. Clear those references before removing it.");
      await db.mediaAsset.delete({ where: { id } });
      return Response.json({ data: { deleted: true, id } }, { headers: { "cache-control": "no-store" } });
    } catch (error) {
      if (error?.code === "P2025") return jsonError(404, "NOT_FOUND", "The media asset was not found.");
      if (error?.code === "P2003") return jsonError(409, "MEDIA_IN_USE", "This image is assigned to content. Clear those references before removing it.");
      return jsonError(503, "MEDIA_UNAVAILABLE", "The media asset could not be removed.");
    }
  }
  return { signature, list, persist, update, remove };
}
