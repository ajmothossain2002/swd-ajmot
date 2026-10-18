export async function validateLoginRequest(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8_192) return { ok: false, status: 413 };

  try {
    const reader = request.body?.getReader();
    if (!reader) return { ok: false, status: 400 };
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8_192) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, status: 400 };
    if (typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email.trim())) return { ok: false, status: 400 };
    if (typeof body.password !== "string" || body.password.length < 1 || body.password.length > 128) return { ok: false, status: 400 };
    return { ok: true, body: raw };
  } catch {
    return { ok: false, status: 400 };
  }
}
