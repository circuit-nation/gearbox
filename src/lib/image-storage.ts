export const S3_VALUE_PREFIX = "s3://";

export type S3ObjectLocation = {
  bucket: string;
  key: string;
};

/** Standard stored form: s3://bucket/object/key */
export function toStoredS3Value(bucket: string, key: string): string {
  const normalizedBucket = bucket.trim();
  const normalizedKey = key.replace(/^\/+/, "");

  if (!normalizedBucket || !normalizedKey) {
    throw new Error("S3 bucket and key are required.");
  }

  return `${S3_VALUE_PREFIX}${normalizedBucket}/${normalizedKey}`;
}

export function isStoredS3Value(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(S3_VALUE_PREFIX));
}

/**
 * Parse a stored S3 reference.
 * - New: s3://bucket-name/folder/file.jpg
 * - Legacy: s3://folder/file.jpg (requires defaultBucket)
 */
export function parseStoredS3Value(
  value: string | null | undefined,
  defaultBucket?: string
): S3ObjectLocation | null {
  if (!isStoredS3Value(value)) {
    return null;
  }

  const path = value!.slice(S3_VALUE_PREFIX.length);
  if (!path) {
    return null;
  }

  if (defaultBucket && path.startsWith(`${defaultBucket}/`)) {
    return {
      bucket: defaultBucket,
      key: path.slice(defaultBucket.length + 1),
    };
  }

  if (defaultBucket) {
    return { bucket: defaultBucket, key: path };
  }

  const slashIndex = path.indexOf("/");
  if (slashIndex === -1) {
    return null;
  }

  return {
    bucket: path.slice(0, slashIndex),
    key: path.slice(slashIndex + 1),
  };
}

export function storedValueToS3Key(
  value: string | null | undefined,
  defaultBucket?: string
): string | null {
  return parseStoredS3Value(value, defaultBucket)?.key ?? null;
}
