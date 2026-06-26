import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { verifyClientToken } from "./client-token";

describe("verifyClientToken", () => {
  it("returns 401 when Authorization header is missing", () => {
    process.env.CN_CLIENT_API_TOKEN = "test-secret";
    const req = new NextRequest("http://localhost/api/articles");
    const res = verifyClientToken(req);
    assert.equal(res?.status, 401);
  });

  it("returns null when Bearer token matches", () => {
    process.env.CN_CLIENT_API_TOKEN = "test-secret";
    const req = new NextRequest("http://localhost/api/articles", {
      headers: { Authorization: "Bearer test-secret" },
    });
    assert.equal(verifyClientToken(req), null);
  });

  it("returns 401 when token mismatches", () => {
    process.env.CN_CLIENT_API_TOKEN = "test-secret";
    const req = new NextRequest("http://localhost/api/articles", {
      headers: { Authorization: "Bearer wrong" },
    });
    assert.equal(verifyClientToken(req)?.status, 401);
  });
});
