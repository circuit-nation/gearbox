import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveCircuitName } from "./circuit-aliases";

describe("resolveCircuitName", () => {
  it("maps Suzuka alias", () => {
    assert.equal(resolveCircuitName("Suzuka Circuit"), "Suzuka International Racing Course");
  });
  it("passes through canonical names", () => {
    assert.equal(resolveCircuitName("Albert Park Circuit"), "Albert Park Circuit");
  });
});
