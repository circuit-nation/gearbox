import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SportsType } from "@/lib/circuit-nation/types";
import type { BuiltEvent, PortableEvent } from "@/lib/events/build-events-json-logic";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env.production") });

const SOURCE_FILES = [
  "f1_events.json",
  "motogp_events.json",
  "wec_events.json",
] as const;

const OUTPUT_PATH = path.resolve(process.cwd(), "src/data/events.json");

async function main() {
  const mongoose = await import("mongoose");
  const {
    assertNoDuplicateSeedKeys,
    buildCircuitLookup,
    transformAllPortableEvents,
  } = await import("@/lib/events/build-events-json-logic");
  const { fetchSeedRefs } = await import("@/lib/events/seed-refs");

  function loadPortableEvents(filename: string): PortableEvent[] {
    const filePath = path.resolve(process.cwd(), "src/data", filename);
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as PortableEvent[];

    if (!Array.isArray(raw)) {
      throw new Error(`${filename} must be an array of portable events.`);
    }

    return raw;
  }

  function logCountsBySportType(
    events: BuiltEvent[],
    sports: Partial<Record<SportsType, string>>
  ) {
    const sportTypeById = new Map(
      Object.entries(sports).map(([sportType, id]) => [id, sportType])
    );
    const counts = new Map<string, number>();

    for (const event of events) {
      const sportType = sportTypeById.get(event.sport_id) ?? "unknown";
      counts.set(sportType, (counts.get(sportType) ?? 0) + 1);
    }

    console.info("Event counts by sport_type:");
    for (const [sportType, count] of [...counts.entries()].sort(([a], [b]) =>
      a.localeCompare(b)
    )) {
      console.info(`  ${sportType}: ${count}`);
    }
  }

  const portableEvents = SOURCE_FILES.flatMap(loadPortableEvents);
  console.info(
    `Loaded ${portableEvents.length} portable events from ${SOURCE_FILES.join(", ")}.`
  );

  const refs = await fetchSeedRefs();
  const lookup = buildCircuitLookup(refs.circuits);

  const events = transformAllPortableEvents(portableEvents, lookup, refs.sports);

  assertNoDuplicateSeedKeys(events.map((event) => event.seed_key));

  writeFileSync(OUTPUT_PATH, `${JSON.stringify({ events }, null, 2)}\n`, "utf8");

  console.info(`Wrote ${events.length} events to ${OUTPUT_PATH}.`);
  logCountsBySportType(events, refs.sports);

  await mongoose.default.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  const mongoose = await import("mongoose");
  void mongoose.default.disconnect();
  process.exit(1);
});
