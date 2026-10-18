export const MEDIA_MAX_BYTES = 8 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const extensionTypes = new Map([["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"], ["webp", "image/webp"], ["avif", "image/avif"]]);

export function validateMediaFile(file) {
  if (!file) return "Choose an image to upload.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!allowedTypes.has(file.type) || extensionTypes.get(extension ?? "") !== file.type) return "Choose a JPEG, PNG, WebP or AVIF image with a matching file extension.";
  if (file.size < 1 || file.size > MEDIA_MAX_BYTES) return "Choose an image larger than 0 bytes and no larger than 8 MB.";
  return "";
}

export function validateAltText(value) {
  const length = value.trim().length;
  if (!length) return "Add concise alt text before uploading.";
  if (length > 300) return "Alt text must be 300 characters or fewer.";
  return "";
}

export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
