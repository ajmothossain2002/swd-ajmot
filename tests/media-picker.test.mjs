import test from "node:test";
import assert from "node:assert/strict";
import { formatFileSize, MEDIA_MAX_BYTES, validateAltText, validateMediaFile } from "../src/components/admin/media-picker-utils.mjs";

test("file validation accepts supported image types through the 8 MB boundary", () => {
  for (const [name, type] of [["photo.jpg", "image/jpeg"], ["photo.jpeg", "image/jpeg"], ["photo.png", "image/png"], ["photo.webp", "image/webp"], ["photo.avif", "image/avif"]]) {
    assert.equal(validateMediaFile({ name, type, size: MEDIA_MAX_BYTES }), "");
  }
});

test("file validation rejects missing, empty, oversized, mismatched and unsupported files", () => {
  assert.match(validateMediaFile(undefined), /Choose an image/);
  assert.match(validateMediaFile({ name: "photo.png", type: "image/png", size: 0 }), /larger than 0 bytes/);
  assert.match(validateMediaFile({ name: "photo.png", type: "image/png", size: MEDIA_MAX_BYTES + 1 }), /8 MB/);
  assert.match(validateMediaFile({ name: "photo.svg", type: "image/svg+xml", size: 100 }), /JPEG, PNG, WebP or AVIF/);
  assert.match(validateMediaFile({ name: "photo.jpg", type: "image/png", size: 100 }), /JPEG, PNG, WebP or AVIF/);
});

test("alt text is required, trimmed for validation and limited to 300 characters", () => {
  assert.match(validateAltText("   "), /Add concise alt text/);
  assert.equal(validateAltText(` ${"a".repeat(300)} `), "");
  assert.match(validateAltText("a".repeat(301)), /300 characters or fewer/);
});

test("file sizes use readable KB and MB units", () => {
  assert.equal(formatFileSize(500), "1 KB");
  assert.equal(formatFileSize(1024 * 1024), "1.0 MB");
});
