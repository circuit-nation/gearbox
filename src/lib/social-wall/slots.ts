export const SOCIAL_WALL_SLOT_IDS = [
  "row1-horizontal-yt",
  "row1-post-top",
  "row1-post-bottom",
  "row1-vertical-ig",
  "row2-vertical-yt",
  "row2-post-top",
  "row2-post-bottom",
  "row2-horizontal-substack",
] as const;

export type SocialWallSlotId = (typeof SOCIAL_WALL_SLOT_IDS)[number];

export function isSocialWallSlotId(value: string): value is SocialWallSlotId {
  return (SOCIAL_WALL_SLOT_IDS as readonly string[]).includes(value);
}

export function sortSlotsByOrder<T extends { slotId: SocialWallSlotId }>(slots: T[]): T[] {
  const order = new Map(SOCIAL_WALL_SLOT_IDS.map((id, index) => [id, index]));
  return [...slots].sort(
    (a, b) => (order.get(a.slotId) ?? 0) - (order.get(b.slotId) ?? 0)
  );
}

export function inferPlatformFromSlotId(slotId: SocialWallSlotId) {
  if (slotId.includes("substack")) return "substack" as const;
  if (slotId.includes("reddit")) return "reddit" as const;
  if (slotId.includes("ig")) return "ig" as const;
  return "yt" as const;
}

export const SLOT_GRID_CLASS: Record<SocialWallSlotId, string> = {
  "row1-horizontal-yt": "col-span-2 row-span-2",
  "row1-post-top": "col-start-3 row-start-1",
  "row1-post-bottom": "col-start-3 row-start-2",
  "row1-vertical-ig": "col-start-4 row-start-1 row-span-2",
  "row2-vertical-yt": "col-start-1 row-start-3 row-span-2",
  "row2-post-top": "col-start-2 row-start-3",
  "row2-post-bottom": "col-start-2 row-start-4",
  "row2-horizontal-substack": "col-start-3 col-span-2 row-start-3 row-span-2",
};

export const SLOT_LABELS: Record<SocialWallSlotId, string> = {
  "row1-horizontal-yt": "Row 1 · Horizontal YouTube",
  "row1-post-top": "Row 1 · Post (top)",
  "row1-post-bottom": "Row 1 · Post (bottom)",
  "row1-vertical-ig": "Row 1 · Vertical Instagram",
  "row2-vertical-yt": "Row 2 · Vertical YouTube",
  "row2-post-top": "Row 2 · Post (top)",
  "row2-post-bottom": "Row 2 · Post (bottom)",
  "row2-horizontal-substack": "Row 2 · Horizontal Substack",
};
