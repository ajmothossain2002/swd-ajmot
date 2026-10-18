export const MEDIA_MAX_BYTES: number;
export const MEDIA_FORMATS: readonly string[];
export function createMediaRateLimiter(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  now?: () => number;
  limit?: number;
  windowSeconds?: number;
}): (request: Request) => Promise<boolean>;
export function createMediaHandlers(options: {
  authorize(request: Request): Promise<{ ok: true } | Response>;
  db: unknown;
  cloudinary: unknown;
  env?: Record<string, string | undefined>;
  rateLimit?: (request: Request) => Promise<boolean>;
  now?: () => number;
  createId?: () => string;
}): {
  signature(request: Request): Promise<Response>;
  list(request: Request): Promise<Response>;
  persist(request: Request): Promise<Response>;
  update(request: Request, id: string): Promise<Response>;
  remove(request: Request, id: string): Promise<Response>;
};
