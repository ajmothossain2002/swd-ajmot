export function validateLoginRequest(request: Request): Promise<{ ok: true; body: string } | { ok: false; status: 400 | 413 }>;
