import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseVideoLimit } from "./parse-limit";

describe("parseVideoLimit", () => {
  const opts = { defaultLimit: 5, maxLimit: 25 };

  it("uses default when limit is missing", () => {
    assert.equal(parseVideoLimit(null, opts), 5);
  });

  it("clamps to max", () => {
    assert.equal(parseVideoLimit("100", opts), 25);
  });

  it("floors at 1 for zero", () => {
    assert.equal(parseVideoLimit("0", opts), 1);
  });

  it("floors negative values at 1", () => {
    assert.equal(parseVideoLimit("-3", opts), 1);
  });

  it("falls back to default for non-numeric", () => {
    assert.equal(parseVideoLimit("abc", opts), 5);
  });

  it("accepts valid integers", () => {
    assert.equal(parseVideoLimit("10", opts), 10);
  });
});
