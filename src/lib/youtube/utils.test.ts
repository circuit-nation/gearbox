import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseIso8601Duration, pickThumbnailUrl } from "./utils";

describe("parseIso8601Duration", () => {
  it("parses PT9M10S", () => {
    assert.equal(parseIso8601Duration("PT9M10S"), 550);
  });

  it("parses PT1H1M1S", () => {
    assert.equal(parseIso8601Duration("PT1H1M1S"), 3661);
  });

  it("parses PT45S", () => {
    assert.equal(parseIso8601Duration("PT45S"), 45);
  });

  it("returns 0 for invalid input", () => {
    assert.equal(parseIso8601Duration("invalid"), 0);
  });
});

describe("pickThumbnailUrl", () => {
  it("prefers maxres then high then medium then default", () => {
    assert.equal(
      pickThumbnailUrl({
        default: { url: "d" },
        medium: { url: "m" },
        high: { url: "h" },
        maxres: { url: "x" },
      }),
      "x"
    );
    assert.equal(
      pickThumbnailUrl({ default: { url: "d" }, high: { url: "h" } }),
      "h"
    );
    assert.equal(pickThumbnailUrl({ default: { url: "d" } }), "d");
    assert.equal(pickThumbnailUrl({}), "");
  });
});
