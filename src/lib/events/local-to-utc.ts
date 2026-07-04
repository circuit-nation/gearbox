import { DateTime } from "luxon";

export function localToUtc(isoLocal: string, timezone: string): string {
  const dt = DateTime.fromISO(isoLocal, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid local time "${isoLocal}" in zone "${timezone}": ${dt.invalidReason}`);
  }
  return dt.toUTC().toISO({ suppressMilliseconds: false })!;
}
