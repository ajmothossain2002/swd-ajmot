"use client";

/* eslint-disable @next/next/no-img-element -- Admin previews use arbitrary Cloudinary URLs without widening public image optimization settings. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatFileSize, validateAltText, validateMediaFile } from "@/components/admin/media-picker-utils.mjs";

type Asset = { id: string; providerId: string; secureUrl: string; altText: string; width: number | null; height: number | null; format: string | null };
type UploadSignature = { cloudName: string; apiKey: string; timestamp: number; signature: string; uploadParams: Record<string, string | number | boolean> };
type CloudinaryImage = { public_id?: unknown };
type PendingUpload = { file: File; publicId: string };

export function MediaPicker({ label, selectedIds, onChange, multiple = false }: { label: string; selectedIds: string[]; onChange(ids: string[]): void; multiple?: boolean }) {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [query, setQuery] = useState("");
  const [altText, setAltText] = useState("");
  const [altError, setAltError] = useState("");
  const [altTouched, setAltTouched] = useState(false);
  const [fileError, setFileError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const previewUrlRef = useRef("");
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [stage, setStage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const selected = assets.filter((asset) => selectedIds.includes(asset.id));
  const safeId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  async function request(path: string, init?: RequestInit) {
    let response: Response;
    try { response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init }); }
    catch { throw new Error("The request could not reach the server. Check your connection and try again."); }
    if (response.status === 401) { router.replace("/admin/login"); throw new Error("Your admin session expired. Sign in again."); }
    const body = await response.json().catch(() => null) as { data?: Asset[] | Asset | UploadSignature; error?: { code?: string; message?: string } } | null;
    if (!response.ok) {
      const fallback = response.status >= 500 ? "The media service is temporarily unavailable. Check its configuration and try again." : "The media request was rejected. Review the image details and try again.";
      throw Object.assign(new Error(body?.error?.message || fallback), { code: body?.error?.code, status: response.status });
    }
    return body?.data;
  }

  async function load(search = query, options: { quiet?: boolean } = {}) {
    if (!options.quiet) setLoading(true);
    setLoadError("");
    try {
      const data = await request(`/api/admin/media?page=1&pageSize=100${search ? `&q=${encodeURIComponent(search)}` : ""}`) as Asset[] | undefined;
      setAssets(Array.isArray(data) ? data : []);
    } catch (loadFailure) {
      setLoadError(loadFailure instanceof Error ? loadFailure.message : "The media library could not be loaded.");
    } finally { if (!options.quiet) setLoading(false); }
  }

  useEffect(() => { queueMicrotask(() => { void load(""); }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(asset: Asset) {
    if (selectedIds.includes(asset.id)) onChange(selectedIds.filter((id) => id !== asset.id));
    else onChange(multiple ? [...selectedIds, asset.id] : [asset.id]);
  }

  function selectFile(nextFile?: File) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = nextFile ? URL.createObjectURL(nextFile) : "";
    setPreviewUrl(previewUrlRef.current);
    setError(""); setMessage(""); setStage(""); setPendingUpload(null); setFile(nextFile ?? null);
    setFileError(nextFile ? validateMediaFile(nextFile) : "");
  }

  async function upload() {
    const validation = validateAltText(altText);
    setAltError(validation);
    if (!file) { setFileError("Choose an image to upload."); return; }
    const invalidFile = validateMediaFile(file);
    setFileError(invalidFile);
    if (invalidFile || validation || busy) return;
    setError(""); setMessage(""); setBusy(true);
    try {
      let publicId = pendingUpload?.file === file ? pendingUpload.publicId : "";
      if (!publicId) {
        setStage("Requesting a secure upload signature…"); setUploadProgress(null);
        const signed = await request("/api/admin/media/signature", { method: "POST" }) as UploadSignature | undefined;
        if (!signed || !signed.cloudName || !signed.signature) throw new Error("The secure upload signature was not returned. Check Cloudinary configuration and try again.");
        setStage("Uploading image to Cloudinary…"); setUploadProgress(0);
        const image = await new Promise<CloudinaryImage>((resolve, reject) => {
          const form = new FormData();
          for (const [key, value] of Object.entries(signed.uploadParams)) form.append(key, String(value));
          form.append("api_key", signed.apiKey); form.append("signature", signed.signature); form.append("file", file);
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`);
          xhr.upload.onprogress = (event) => { if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100)); };
          xhr.onerror = () => reject(new Error("The image could not reach Cloudinary. Check your connection and try again."));
          xhr.onload = () => {
            let result: { public_id?: unknown; error?: { message?: string } } = {};
            try { result = JSON.parse(xhr.responseText || "{}") as typeof result; } catch { reject(new Error("Cloudinary returned an unreadable response. Try again.")); return; }
            if (xhr.status < 200 || xhr.status >= 300) {
              const guidance = xhr.status === 401 ? "The Cloudinary signature was rejected. Check the signed upload preset and server credentials." : "Cloudinary rejected this image. Confirm its format and size, then try again.";
              reject(new Error(result.error?.message || guidance));
            } else resolve(result);
          };
          xhr.send(form);
        });
        if (typeof image.public_id !== "string") throw new Error("Cloudinary returned an invalid image response. Try again.");
        publicId = image.public_id;
        setPendingUpload({ file, publicId });
      }

      setStage("Verifying and saving the image to the media library…"); setUploadProgress(null);
      let saved: Asset;
      try {
        saved = await request("/api/admin/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ publicId, altText: altText.trim() }) }) as Asset;
      } catch (persistError) {
        const duplicate = persistError as Error & { code?: string };
        if (duplicate.code !== "MEDIA_EXISTS") throw persistError;
        setStage("Checking for the existing library entry…");
        const existing = await request(`/api/admin/media?page=1&pageSize=10&q=${encodeURIComponent(publicId)}`) as Asset[] | undefined;
        const match = existing?.find((asset) => asset.providerId === publicId);
        if (!match) throw new Error("This image already exists, but its library entry could not be loaded. Search for it in the media library.");
        saved = match;
      }
      setStage("Refreshing the media library…");
      await load("", { quiet: true });
      setAssets((previous) => [saved, ...previous.filter((asset) => asset.id !== saved.id)]);
      onChange(multiple ? [...new Set([...selectedIds, saved.id])] : [saved.id]);
      setAltText(""); setAltError(""); setAltTouched(false); setPendingUpload(null); selectFile(); setMessage("Image verified and saved to the media library."); setStage("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The image upload failed. Try again.");
      setStage("");
    } finally { setBusy(false); setUploadProgress(null); }
  }

  async function saveAlt(asset: Asset, value: string) {
    if (!value.trim() || value.trim() === asset.altText || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const updated = await request(`/api/admin/media/${asset.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ altText: value.trim() }) }) as Asset | undefined;
      if (updated) setAssets((items) => items.map((item) => item.id === updated.id ? updated : item));
      setMessage("Alt text saved.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Alt text could not be saved."); }
    finally { setBusy(false); }
  }

  return <fieldset className="space-y-4 border border-line p-4 sm:p-5">
    <legend className="px-1 text-sm font-medium">{label}</legend>
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,0.8fr)]">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor={`alt-${safeId}`}>Alt text for uploaded image</label>
          <input aria-describedby={`alt-hint-${safeId} alt-count-${safeId}${altError ? ` alt-error-${safeId}` : ""}`} aria-invalid={Boolean(altError)} className="min-h-10 w-full border border-line bg-card px-3 text-sm text-ink" id={`alt-${safeId}`} maxLength={300} onBlur={() => { setAltTouched(true); setAltError(validateAltText(altText)); }} onChange={(event) => { setAltText(event.target.value); if (altTouched) setAltError(validateAltText(event.target.value)); }} value={altText} />
          <p className="mt-1 text-xs text-muted" id={`alt-hint-${safeId}`}>Describe the image&apos;s meaningful content or purpose.</p>
          <div className="flex justify-between gap-3 text-xs"><span className={altError ? "text-red-700 dark:text-red-300" : "text-muted"} id={`alt-error-${safeId}`} role={altError ? "alert" : undefined}>{altError}</span><span className="text-muted" id={`alt-count-${safeId}`}>{altText.length}/300</span></div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center border border-line px-4 text-sm hover:border-accent focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">{file ? "Replace image" : "Choose image"}<input accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy} onChange={(event) => { selectFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} type="file" /></label>
          <button className="min-h-10 bg-ink px-4 text-sm text-white hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" disabled={!file || Boolean(fileError) || Boolean(validateAltText(altText)) || busy} onClick={() => void upload()} type="button">{busy ? "Working…" : pendingUpload ? "Retry saving" : "Upload image"}</button>
          {file ? <button className="min-h-10 px-2 text-sm text-muted underline underline-offset-4 hover:text-ink" disabled={busy} onClick={() => selectFile()} type="button">Remove</button> : null}
        </div>
        <p className="text-xs leading-5 text-muted">JPEG, PNG, WebP or AVIF · up to 8 MB. Selecting a file only creates a local preview; upload starts when you choose Upload image.</p>
        {fileError ? <p className="text-sm text-red-700 dark:text-red-300" role="alert">{fileError}</p> : null}
      </div>
      <div className="min-h-40 border border-dashed border-line bg-surface p-3" aria-label="Selected image preview">
        {file && previewUrl ? <div className="flex h-full flex-col gap-3 sm:flex-row">
          <img alt="" className="aspect-[4/3] w-full bg-card object-contain sm:w-40" src={previewUrl} />
          <dl className="min-w-0 space-y-1 self-center text-xs"><dt className="font-medium text-ink">Selected file</dt><dd className="break-all text-muted">{file.name}</dd><dd className="text-muted">{formatFileSize(file.size)} · {file.type || "Unknown type"}</dd><dd className={fileError ? "text-red-700 dark:text-red-300" : "text-muted"}>{fileError ? "Needs attention" : pendingUpload ? "Uploaded · awaiting library save" : "Ready to upload"}</dd></dl>
        </div> : <p className="flex min-h-32 items-center justify-center text-center text-sm text-muted">Choose an image to preview it here before uploading.</p>}
      </div>
    </div>
    {busy && stage ? <p className="text-sm text-muted" role="status" aria-live="polite">{stage}{uploadProgress !== null ? ` ${uploadProgress}%` : ""}</p> : null}
    {uploadProgress !== null ? <progress aria-label="Image upload progress" className="w-full" max={100} value={uploadProgress} /> : null}
    {error ? <p className="text-sm text-red-700 dark:text-red-300" role="alert">{error}</p> : null}
    {message ? <p className="text-sm text-accent" role="status">{message}</p> : null}
    <div className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor={`search-${safeId}`}>Search existing images by alt text or ID</label><input className="min-h-10 min-w-0 flex-1 border border-line bg-card px-3 text-sm text-ink" id={`search-${safeId}`} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void load(); } }} placeholder="Search media by alt text or ID" value={query} /><button className="min-h-10 border border-line px-4 text-sm hover:border-accent disabled:opacity-50" disabled={loading} onClick={() => void load()} type="button">Search</button></div>
    {loading ? <p className="text-sm text-muted" role="status">Loading media library…</p> : loadError ? <div className="space-y-2" role="alert"><p className="text-sm text-red-700 dark:text-red-300">{loadError}</p><button className="text-sm underline underline-offset-4" onClick={() => void load()} type="button">Retry</button></div> : assets.length ? <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
      {assets.map((asset) => <div className={`min-w-0 border p-2 ${selectedIds.includes(asset.id) ? "border-accent" : "border-line"}`} key={asset.id}>
        <button aria-pressed={selectedIds.includes(asset.id)} className="block w-full text-left focus-visible:outline-2 focus-visible:outline-accent" onClick={() => toggle(asset)} type="button"><img alt="" className="aspect-[4/3] w-full bg-surface object-cover" loading="lazy" src={asset.secureUrl} /><span className="mt-2 block truncate text-xs">{selectedIds.includes(asset.id) ? "Selected · " : "Select · "}{asset.providerId}</span></button>
        <label className="mt-2 block text-[11px] text-muted">Alt text<input aria-label={`Alt text for ${asset.providerId}`} className="mt-1 min-h-9 w-full border border-line bg-card px-2 text-xs text-ink" defaultValue={asset.altText} key={`${asset.id}:${asset.altText}`} onBlur={(event) => void saveAlt(asset, event.currentTarget.value)} /></label>
      </div>)}
    </div> : <p className="text-sm text-muted">{query ? "No matching images. Try another search or upload an image." : "No images are in the media library yet. Choose an image above to get started."}</p>}
    {selected.length ? <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3"><p className="text-xs text-muted">{selected.length} selected</p><button className="text-xs underline decoration-line underline-offset-4 hover:text-ink" onClick={() => onChange([])} type="button">Clear selection</button><div className="flex gap-2">{selected.slice(0, 5).map((asset) => <img alt="" className="size-10 border border-line object-cover" key={asset.id} src={asset.secureUrl} />)}</div></div> : <p className="text-xs text-muted">No image selected.</p>}
  </fieldset>;
}
