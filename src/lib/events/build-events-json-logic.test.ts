import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertNoDuplicateSeedKeys,
  buildCircuitLookup,
  resolveSportId,
  transformPortableEvent,
} from "./build-events-json-logic";
import type { PortableEvent } from "./build-events-json-logic";

describe("buildCircuitLookup", () => {
  it("finds circuit by sport_type and name", () => {
    const lookup = buildCircuitLookup([
      { _id: "abc", name: "Albert Park Circuit", sport_type: "formula" },
    ]);
    assert.equal(lookup.get("formula::Albert Park Circuit"), "abc");
  });
});

describe("resolveSportId", () => {
  it("returns sport ObjectId for known sport_type", () => {
    const id = resolveSportId({ formula: "sport-formula-id" }, "formula");
    assert.equal(id, "sport-formula-id");
  });

  it("throws when sport_type is missing from refs", () => {
    assert.throws(
      () => resolveSportId({}, "motogp"),
      /No sport_id found for sport_type "motogp"/
    );
  });
});

describe("transformPortableEvent", () => {
  const lookup = buildCircuitLookup([
    { _id: "circuit-melbourne", name: "Albert Park Circuit", sport_type: "formula" },
    {
      _id: "circuit-suzuka",
      name: "Suzuka International Racing Course",
      sport_type: "formula",
    },
  ]);
  const sports = { formula: "sport-formula-id" };

  it("maps portable event to seed-ready output with UTC times", () => {
    const event: PortableEvent = {
      id: "f1-2026-rd01-australia-race",
      title: "Australian Grand Prix - Race",
      round: 1,
      type: "race",
      sport_type: "formula",
      circuit_name: "Albert Park Circuit",
      event_start_at_local: "2026-03-08T15:00:00",
      event_end_at_local: "2026-03-08T17:00:00",
      timezone: "Australia/Melbourne",
      links: {
        watch_url: "https://f1tv.formula1.com",
        watch_label: "Watch on F1 TV",
      },
    };

    const result = transformPortableEvent(event, lookup, sports);

    assert.deepEqual(result, {
      seed_key: "f1-2026-rd01-australia-race",
      title: "Australian Grand Prix - Race",
      round: 1,
      type: "race",
      sport_id: "sport-formula-id",
      circuit_id: "circuit-melbourne",
      event_start_at: "2026-03-08T04:00:00.000Z",
      event_end_at: "2026-03-08T06:00:00.000Z",
      links: {
        watch_url: "https://f1tv.formula1.com",
        watch_label: "Watch on F1 TV",
      },
    });
  });

  it("applies default links when omitted", () => {
    const event: PortableEvent = {
      id: "motogp-2026-rd01-thailand-race",
      title: "Thailand GP - Race",
      round: 1,
      type: "race",
      sport_type: "motogp",
      circuit_name: "Chang International Circuit",
      event_start_at_local: "2026-02-28T15:00:00",
      event_end_at_local: "2026-02-28T16:00:00",
      timezone: "Asia/Bangkok",
    };

    const motogpLookup = buildCircuitLookup([
      { _id: "circuit-thailand", name: "Chang International Circuit", sport_type: "motogp" },
    ]);

    const result = transformPortableEvent(event, motogpLookup, { motogp: "sport-motogp-id" });

    assert.equal(result.links.watch_url, "https://www.motogp.com/en/video");
    assert.equal(result.links.watch_label, "Watch on MotoGP");
  });

  it("resolves circuit name aliases before lookup", () => {
    const event: PortableEvent = {
      id: "f1-2026-rd09-japan-race",
      title: "Japanese Grand Prix - Race",
      round: 9,
      type: "race",
      sport_type: "formula",
      circuit_name: "Suzuka Circuit",
      event_start_at_local: "2026-03-29T14:00:00",
      event_end_at_local: "2026-03-29T16:00:00",
      timezone: "Asia/Tokyo",
    };

    const result = transformPortableEvent(event, lookup, sports);

    assert.equal(result.circuit_id, "circuit-suzuka");
  });

  it("resolves MotoGP Losail spelling without Lusail alias", () => {
    const event: PortableEvent = {
      id: "motogp-2026-rd20-qatar-race",
      title: "Qatar GP - Race",
      round: 20,
      type: "race",
      sport_type: "motogp",
      circuit_name: "Losail International Circuit",
      event_start_at_local: "2026-11-22T18:00:00",
      event_end_at_local: "2026-11-22T19:00:00",
      timezone: "Asia/Qatar",
    };

    const motogpLookup = buildCircuitLookup([
      { _id: "circuit-losail", name: "Losail International Circuit", sport_type: "motogp" },
    ]);

    const result = transformPortableEvent(event, motogpLookup, { motogp: "sport-motogp-id" });

    assert.equal(result.circuit_id, "circuit-losail");
  });

  it("throws when circuit cannot be resolved", () => {
    const event: PortableEvent = {
      id: "f1-unknown-circuit",
      title: "Unknown Circuit Race",
      round: 1,
      type: "race",
      sport_type: "formula",
      circuit_name: "Nonexistent Circuit",
      event_start_at_local: "2026-03-08T15:00:00",
      event_end_at_local: "2026-03-08T17:00:00",
      timezone: "Australia/Melbourne",
    };

    assert.throws(
      () => transformPortableEvent(event, lookup, sports),
      /Unresolved circuit for formula::Nonexistent Circuit/
    );
  });
});

describe("assertNoDuplicateSeedKeys", () => {
  it("passes when all seed keys are unique", () => {
    assert.doesNotThrow(() =>
      assertNoDuplicateSeedKeys(["f1-race-1", "f1-race-2", "motogp-race-1"])
    );
  });

  it("throws when duplicate seed keys exist", () => {
    assert.throws(
      () => assertNoDuplicateSeedKeys(["f1-race-1", "f1-race-1"]),
      /Duplicate seed_key: "f1-race-1"/
    );
  });
});
