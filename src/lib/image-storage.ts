export const S3_VALUE_PREFIX = "s3://";

export function toStoredS3Value(key: string) {
  return `${S3_VALUE_PREFIX}${key}`;
}

export function isStoredS3Value(value: string | null | undefined) {
  return Boolean(value && value.startsWith(S3_VALUE_PREFIX));
}

export function storedValueToS3Key(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return isStoredS3Value(value) ? value.slice(S3_VALUE_PREFIX.length) : null;
}

