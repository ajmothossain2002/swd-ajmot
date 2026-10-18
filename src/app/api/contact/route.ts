import { createContactHandler } from "@/lib/contact-server.mjs";

export const runtime = "nodejs";

export const POST = createContactHandler();
