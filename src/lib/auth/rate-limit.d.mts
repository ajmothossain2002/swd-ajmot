export function checkAndRecordLoginAttempt(request: Request, options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  now?: () => number;
}): Promise<{ allowed: boolean; reason?: "configuration" | "unavailable" }>;
export function clearLocalLoginAttempts(): void;
