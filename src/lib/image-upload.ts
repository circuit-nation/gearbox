export const ALLOWED_UPLOAD_FOLDERS = [
  "drivers",
  "events",
  "sports",
  "teams",
  "circuits",
  "tier_nation/entities",
  "tier_nation/lists",
] as const;
export type UploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg", "webp"] as const;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const MIME_TYPE_BY_EXTENSION: Record<(typeof ALLOWED_IMAGE_EXTENSIONS)[number], string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  svg: ["image/svg+xml"],
  webp: ["image/webp"],
};

export function normalizeExtension(raw: string | null | undefined) {
  if (!raw) {
    return "";
  }

  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isAllowedImageExtension(extension: string) {
  return ALLOWED_IMAGE_EXTENSIONS.includes(extension as (typeof ALLOWED_IMAGE_EXTENSIONS)[number]);
}

export function isAllowedMimeTypeForExtension(extension: string, mimeType: string) {
  const allowedMimeTypes =
    MIME_TYPE_BY_EXTENSION[extension as (typeof ALLOWED_IMAGE_EXTENSIONS)[number]] || [];
  return allowedMimeTypes.includes(mimeType.toLowerCase());
}

export function sanitizeObjectName(raw: string | null | undefined) {
  const normalized = (raw || "image")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "image";
}

export function isAllowedUploadFolder(folder: string | null | undefined): folder is UploadFolder {
  return ALLOWED_UPLOAD_FOLDERS.includes(folder as UploadFolder);
}
