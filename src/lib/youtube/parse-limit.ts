type ParseLimitOptions = {
  defaultLimit: number;
  maxLimit: number;
};

export function parseVideoLimit(
  raw: string | null,
  { defaultLimit, maxLimit }: ParseLimitOptions
): number {
  if (raw === null || raw.trim() === "") {
    return defaultLimit;
  }

  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return defaultLimit;
  }

  return Math.min(Math.max(1, Math.floor(n)), maxLimit);
}
