import { postItemHandlers } from "@/lib/cms/route-handlers";

export const runtime = "nodejs";
export const GET = postItemHandlers.GET;
export const PATCH = postItemHandlers.PATCH;
export const DELETE = postItemHandlers.DELETE;
