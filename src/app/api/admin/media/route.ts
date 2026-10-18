import "server-only";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { prisma } from "@/lib/prisma";
import { getCloudinaryServerClient } from "@/lib/cloudinary-server";
import { createMediaHandlers, createMediaRateLimiter } from "@/lib/cms/media-service.mjs";

export const runtime = "nodejs";

const media = createMediaHandlers({ authorize: requireAdminApi, db: prisma, cloudinary: getCloudinaryServerClient(), env: process.env, rateLimit: createMediaRateLimiter() });

export async function GET(request: Request) {
  return media.list(request);
}

export async function POST(request: Request) {
  return media.persist(request);
}
