import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { syncEventLinks } from "@/lib/circuit-nation/event-links";
import { eventSchema } from "@/lib/circuit-nation/validators";
import { CircuitModel, EventModel, SportModel } from "@/lib/models/core.models";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env.production") });

const DATA_PATH = path.resolve(process.cwd(), "src/data/events.json");

type RawEvent = {
  seed_key?: string;
  title: string;
  round: number;
  type: string;
  sport_id: string;
  circuit_id: string;
  event_start_at: string;
  event_end_at: string;
  links?: {
    watch_url?: string;
    watch_label?: string;
    youtube?: string;
    instagram?: string;
    discord?: string;
    x?: string;
    sources?: string[];
  };
};

type EventsFile = {
  events: RawEvent[];
};

function readEventsFile(): EventsFile {
  const raw = JSON.parse(readFileSync(DATA_PATH, "utf8")) as EventsFile;

  if (!Array.isArray(raw.events)) {
    throw new Error("events.json must contain an events array.");
  }

  return raw;
}

async function assertReferenceExists(
  model: typeof SportModel | typeof CircuitModel,
  id: string,
  label: string,
  eventTitle: string
) {
  const document = await model.findById(id).lean();
  if (!document) {
    throw new Error(`Event "${eventTitle}": ${label} "${id}" was not found in MongoDB.`);
  }
}

async function findExistingEvent(raw: RawEvent) {
  const byComposite = await EventModel.findOne({
    title: raw.title,
    round: raw.round,
    sport_id: raw.sport_id,
  }).lean();

  if (byComposite) {
    return byComposite;
  }

  if (!raw.seed_key) {
    return null;
  }

  return EventModel.findOne({
    title: raw.seed_key,
    round: raw.round,
    sport_id: raw.sport_id,
  }).lean();
}

async function main() {
  const uri = process.env.CN_MONGODB_URI ?? process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Set CN_MONGODB_URI or MONGODB_URI before seeding events.");
  }

  await mongoose.connect(uri);
  console.info("Connected to MongoDB.");

  const { events } = readEventsFile();
  let created = 0;
  let updated = 0;

  for (const raw of events) {
    await assertReferenceExists(SportModel, raw.sport_id, "sport_id", raw.title);
    await assertReferenceExists(CircuitModel, raw.circuit_id, "circuit_id", raw.title);

    const parsed = eventSchema.safeParse({
      title: raw.title,
      round: raw.round,
      type: raw.type,
      sport_id: raw.sport_id,
      circuit_id: raw.circuit_id,
      event_start_at: raw.event_start_at,
      event_end_at: raw.event_end_at,
      links: raw.links,
    });

    if (!parsed.success) {
      throw new Error(`Invalid event "${raw.title}": ${parsed.error.message}`);
    }

    const { links, ...eventData } = parsed.data;
    const existing = await findExistingEvent(raw);
    const linksId = await syncEventLinks(
      existing?.links_id ? String(existing.links_id) : null,
      links
    );

    if (existing) {
      await EventModel.findByIdAndUpdate(
        existing._id,
        {
          ...eventData,
          title: raw.title,
          links_id: linksId,
        },
        { runValidators: true }
      );
      updated += 1;
      console.info(`Updated event: ${raw.title}`);
      continue;
    }

    await EventModel.create({
      ...eventData,
      links_id: linksId,
    });
    created += 1;
    console.info(`Created event: ${raw.title}`);
  }

  const total = await EventModel.countDocuments();
  console.info("Events seed complete.");
  console.info(`  created: ${created}`);
  console.info(`  updated: ${updated}`);
  console.info(`  total:   ${total}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  void mongoose.disconnect();
  process.exit(1);
});
