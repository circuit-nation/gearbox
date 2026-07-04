import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeArticleGuid } from "./sync-articles";

describe("normalizeArticleGuid", () => {
  it("uses rss guid when present", () => {
    assert.equal(normalizeArticleGuid("abc-123", "https://x.com/a"), "abc-123");
  });

  it("falls back to url-based hash when guid empty", () => {
    const a = normalizeArticleGuid("", "https://circuitnation.substack.com/p/foo");
    const b = normalizeArticleGuid("", "https://circuitnation.substack.com/p/foo");
    assert.equal(a, b);
    assert.ok(a.length > 0);
  });
});
