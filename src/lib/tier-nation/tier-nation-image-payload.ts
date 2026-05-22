import { isStoredS3Value, toStoredS3Value } from "@/lib/image-storage";

/**
 * Same as drivers/events: send the stored reference as-is (`s3://…` or an external URL string).
 */
export function toTierNationImageField(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed;
}

/**
 * Persist like drivers: keep `s3://` when the UI used our upload flow; bare object keys get `s3://` prefixed.
 * External `http(s)` URLs are stored unchanged.
 */
export function normalizeStoredImageForDb(
  value: string | undefined | null,
  defaultBucket: string
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  if (isStoredS3Value(trimmed)) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return toStoredS3Value(defaultBucket, trimmed);
}
