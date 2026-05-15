import { createHash, timingSafeEqual } from "node:crypto";

export function timingSafeStringEqual(expected: string, received: string) {
  const a = createHash("sha256").update(expected, "utf8").digest();
  const b = createHash("sha256").update(received, "utf8").digest();
  return a.length === b.length && timingSafeEqual(a, b);
}
