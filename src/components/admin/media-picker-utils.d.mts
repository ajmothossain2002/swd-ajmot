export const MEDIA_MAX_BYTES: number;
export function validateMediaFile(file: { name: string; type: string; size: number } | null | undefined): string;
export function validateAltText(value: string): string;
export function formatFileSize(bytes: number): string;
