export const TRACK_TYPES = ["permanent", "street", "temporary", "mixed"] as const;
export const DIRECTIONS = ["clockwise", "counterclockwise"] as const;

export function parseOptionalNumber(value: string) {
  return value === "" ? undefined : Number(value);
}
