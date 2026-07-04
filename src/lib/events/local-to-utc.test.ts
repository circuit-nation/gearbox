import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { localToUtc } from "./local-to-utc";

describe("localToUtc", () => {
  it("converts Melbourne local to UTC", () => {
    const utc = localToUtc("2026-03-08T15:00:00", "Australia/Melbourne");
    assert.equal(utc, "2026-03-08T04:00:00.000Z");
  });

  it("converts Jeddah local to UTC", () => {
    const utc = localToUtc("2026-04-19T20:00:00", "Asia/Riyadh");
    assert.equal(utc, "2026-04-19T17:00:00.000Z");
  });

  it("throws on invalid timezone", () => {
    assert.throws(() => localToUtc("2026-01-01T12:00:00", "Invalid/Zone"));
  });
});
