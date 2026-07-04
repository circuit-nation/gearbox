import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveWatchFields } from "./globe-mapper";

describe("resolveWatchFields", () => {
  it("prefers watch_url over youtube", () => {
    const r = resolveWatchFields({
      watch_url: "https://a.com",
      youtube: "https://b.com",
      watch_label: "Watch",
    });
    assert.equal(r.watchUrl, "https://a.com");
    assert.equal(r.watchLabel, "Watch");
  });

  it("falls back to youtube", () => {
    const r = resolveWatchFields({ youtube: "https://b.com" });
    assert.equal(r.watchUrl, "https://b.com");
    assert.equal(r.watchLabel, "Watch live");
  });
});
