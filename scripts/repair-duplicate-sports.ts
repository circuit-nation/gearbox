/**
 * Merge duplicate F1 / MotoGP sports created by re-running seed without --reset.
 *
 * Keeps sports with empty tags and s3:// logos; remaps events and deletes
 * duplicate circuits, teams, drivers, and sport documents.
 *
 * Usage:
 *   pnpm repair:duplicate-sports              # apply fixes
 *   pnpm repair:duplicate-sports --dry-run    # report only
 *
 * Requires: CN_MONGODB_URI (or MONGODB_URI)
 */
import { config } from "dotenv";
import path from "node:path";
import mongoose, { Types } from "mongoose";
import {
  CircuitModel,
  DriverModel,
  EventModel,
  SportModel,
  TeamModel,
} from "@/lib/models/core.models";
import type { SportsType } from "@/lib/circuit-nation/types";

config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env.production") });

const dryRun = process.argv.includes("--dry-run");

const DUPLICATE_SPORT_TYPES: SportsType[] = ["formula", "motogp"];

/** Drop-side circuit names that differ from the kept canonical name. */
const CIRCUIT_NAME_ALIASES: Record<string, string> = {
  "Jeddah Corniche Circuit": "Jeddah Circuit",
  "Madrid Street Circuit (IFEMA)": "Madring Street Circuit",
};

type SportDoc = {
  _id: Types.ObjectId;
  name: string;
  logo: string;
  type: SportsType;
  tags?: string[];
};

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isKeptSport(sport: SportDoc): boolean {
  const hasTags = (sport.tags?.length ?? 0) > 0;
  const hasS3Logo = sport.logo.startsWith("s3://");
  return !hasTags && hasS3Logo;
}

function pickSportPair(sports: SportDoc[], type: SportsType) {
  const matches = sports.filter((sport) => sport.type === type);
  if (matches.length < 2) {
    return null;
  }

  const keep = matches.find(isKeptSport);
  const drop = matches.find((sport) => sport._id.toString() !== keep?._id.toString() && !isKeptSport(sport));

  if (!keep || !drop) {
    throw new Error(
      `Could not resolve keep/drop pair for "${type}". Found: ${matches
        .map((sport) => `${sport._id} tags=${sport.tags?.length ?? 0} logo=${sport.logo.slice(0, 30)}`)
        .join("; ")}`
    );
  }

  return { keep, drop, type };
}

async function buildCircuitRemap(keepSportId: Types.ObjectId, dropSportId: Types.ObjectId) {
  const [keepCircuits, dropCircuits] = await Promise.all([
    CircuitModel.find({ sport_id: keepSportId }).lean(),
    CircuitModel.find({ sport_id: dropSportId }).lean(),
  ]);

  const keepByName = new Map(keepCircuits.map((circuit) => [circuit.name, circuit]));
  const keepByNormalized = new Map(
    keepCircuits.map((circuit) => [normalizeName(circuit.name), circuit])
  );

  const remap = new Map<string, string>();
  const reparentIds: string[] = [];

  for (const dropCircuit of dropCircuits) {
    const aliasTarget = CIRCUIT_NAME_ALIASES[dropCircuit.name];
    const keepCircuit =
      keepByName.get(dropCircuit.name) ??
      (aliasTarget ? keepByName.get(aliasTarget) : undefined) ??
      keepByNormalized.get(normalizeName(dropCircuit.name)) ??
      (aliasTarget ? keepByNormalized.get(normalizeName(aliasTarget)) : undefined);

    if (keepCircuit) {
      remap.set(dropCircuit._id.toString(), keepCircuit._id.toString());
      console.info(
        `  circuit "${dropCircuit.name}" ${dropCircuit._id} → ${keepCircuit._id} ("${keepCircuit.name}")`
      );
      continue;
    }

    reparentIds.push(dropCircuit._id.toString());
    console.info(
      `  circuit "${dropCircuit.name}" ${dropCircuit._id} — no keep match; will reparent sport_id`
    );
  }

  return { remap, reparentIds };
}

async function repairSportPair(keep: SportDoc, drop: SportDoc) {
  console.info(`\n=== ${keep.name} (${keep.type}) ===`);
  console.info(`  keep: ${keep._id} (${keep.logo})`);
  console.info(`  drop: ${drop._id} (${drop.logo})`);

  const { remap: circuitRemap, reparentIds } = await buildCircuitRemap(keep._id, drop._id);

  const events = await EventModel.find({ sport_id: drop._id }).lean();
  console.info(`  events to remap: ${events.length}`);

  for (const event of events) {
    const circuitId = event.circuit_id.toString();
    const nextCircuitId = circuitRemap.get(circuitId) ?? circuitId;

    if (!dryRun) {
      await EventModel.updateOne(
        { _id: event._id },
        { sport_id: keep._id, circuit_id: new Types.ObjectId(nextCircuitId) }
      );
    }
  }

  if (!dryRun && reparentIds.length > 0) {
    await CircuitModel.updateMany(
      { _id: { $in: reparentIds.map((id) => new Types.ObjectId(id)) } },
      { sport_id: keep._id }
    );
  }

  const dropCircuitDeleteIds = [...circuitRemap.keys()].map((id) => new Types.ObjectId(id));
  const [driversDeleted, teamsDeleted, circuitsDeleted] = dryRun
    ? [
        await DriverModel.countDocuments({ sport_id: drop._id }),
        await TeamModel.countDocuments({ sport_id: drop._id }),
        dropCircuitDeleteIds.length,
      ]
    : await Promise.all([
        DriverModel.deleteMany({ sport_id: drop._id }).then((result) => result.deletedCount),
        TeamModel.deleteMany({ sport_id: drop._id }).then((result) => result.deletedCount),
        dropCircuitDeleteIds.length > 0
          ? CircuitModel.deleteMany({ _id: { $in: dropCircuitDeleteIds } }).then(
              (result) => result.deletedCount
            )
          : Promise.resolve(0),
      ]);

  if (!dryRun) {
    await SportModel.deleteOne({ _id: drop._id });
  }

  return {
    eventsRemapped: events.length,
    circuitsReparented: reparentIds.length,
    circuitsDeleted,
    teamsDeleted,
    driversDeleted,
    sportDeleted: 1,
  };
}

async function verifyNoDuplicateSports() {
  const duplicates = await SportModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$type", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 }, _id: { $in: DUPLICATE_SPORT_TYPES } } },
  ]);

  if (duplicates.length > 0) {
    throw new Error(`Duplicate sports remain for types: ${duplicates.map((row) => row._id).join(", ")}`);
  }
}

async function verifyNoOrphanedEventRefs() {
  const db = mongoose.connection.db;
  if (!db) return;

  const orphaned = await db
    .collection("events")
    .aggregate([{ $match: { sport_id: { $exists: true } } }, {
      $lookup: {
        from: "sports",
        localField: "sport_id",
        foreignField: "_id",
        as: "sport",
      },
    }, { $match: { sport: { $size: 0 } } }, { $count: "count" }])
    .toArray();

  const count = orphaned[0]?.count ?? 0;
  if (count > 0) {
    throw new Error(`${count} events still reference missing sports.`);
  }
}

async function main() {
  const uri = process.env.CN_MONGODB_URI ?? process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Set CN_MONGODB_URI or MONGODB_URI before running repair.");
  }

  await mongoose.connect(uri);
  console.info(`Connected to MongoDB${dryRun ? " (dry-run)" : ""}.`);

  const sports = (await SportModel.find().lean()) as SportDoc[];
  console.info(`Found ${sports.length} sports.`);

  const totals = {
    eventsRemapped: 0,
    circuitsReparented: 0,
    circuitsDeleted: 0,
    teamsDeleted: 0,
    driversDeleted: 0,
    sportsDeleted: 0,
  };

  for (const type of DUPLICATE_SPORT_TYPES) {
    const pair = pickSportPair(sports, type);
    if (!pair) {
      console.info(`No duplicate pair for ${type}; skipping.`);
      continue;
    }

    const result = await repairSportPair(pair.keep, pair.drop);
    totals.eventsRemapped += result.eventsRemapped;
    totals.circuitsReparented += result.circuitsReparented;
    totals.circuitsDeleted += result.circuitsDeleted;
    totals.teamsDeleted += result.teamsDeleted;
    totals.driversDeleted += result.driversDeleted;
    totals.sportsDeleted += result.sportDeleted;
  }

  console.info("\nSummary:");
  console.info(`  events remapped:       ${totals.eventsRemapped}`);
  console.info(`  circuits reparented:   ${totals.circuitsReparented}`);
  console.info(`  circuits deleted:      ${totals.circuitsDeleted}`);
  console.info(`  teams deleted:         ${totals.teamsDeleted}`);
  console.info(`  drivers deleted:       ${totals.driversDeleted}`);
  console.info(`  sports deleted:        ${totals.sportsDeleted}`);

  if (!dryRun) {
    await verifyNoDuplicateSports();
    await verifyNoOrphanedEventRefs();

    const finalSports = await SportModel.find().lean();
    console.info("\nRemaining sports:");
    for (const sport of finalSports) {
      console.info(
        `  ${sport.name} (${sport.type}) — tags: ${sport.tags?.length ?? 0}, logo: ${sport.logo.slice(0, 60)}`
      );
    }
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  void mongoose.disconnect();
  process.exit(1);
});
