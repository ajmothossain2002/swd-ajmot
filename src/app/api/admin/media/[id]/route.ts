import "server-only";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { prisma } from "@/lib/prisma";
import { getCloudinaryServerClient } from "@/lib/cloudinary-server";
import { createMediaHandlers, createMediaRateLimiter } from "@/lib/cms/media-service.mjs";

export const runtime = "nodejs";
const media = createMediaHandlers({ authorize: requireAdminApi, db: prisma, cloudinary: getCloudinaryServerClient(), env: process.env, rateLimit: createMediaRateLimiter() });

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return media.update(request, (await context.params).id);
}
export async function DELETE(request: Request, context: Context) {
  return media.remove(request, (await context.params).id);
}
