/**
 * Repair stale sport_id references on drivers and leaderboards.
 *
 * Usage:
 *   pnpm repair:refs              # apply fixes
 *   pnpm repair:refs --dry-run    # report mismatches only
 *
 * Requires: CN_MONGODB_URI (or MONGODB_URI)
 */
import { config } from "dotenv";
import path from "node:path";
import mongoose, { Types } from "mongoose";
import { DriverModel, SportModel, TeamModel } from "@/lib/models/core.models";
import {
  DriverLeaderboardModel,
  TeamLeaderboardModel,
} from "@/lib/models/leaderboard.models";

config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env.production") });

const dryRun = process.argv.includes("--dry-run");

function idsEqual(a: Types.ObjectId | string | null | undefined, b: Types.ObjectId | string | null | undefined) {
  if (!a || !b) return false;
  return a.toString() === b.toString();
}

async function countOrphanedSportIds(collection: string): Promise<number> {
  const db = mongoose.connection.db;
  if (!db) return 0;

  const result = await db
    .collection(collection)
    .aggregate([
      {
        $lookup: {
          from: "sports",
          localField: "sport_id",
          foreignField: "_id",
          as: "sport",
        },
      },
      { $match: { sport: { $size: 0 } } },
      { $count: "count" },
    ])
    .toArray();

  return result[0]?.count ?? 0;
}

async function repairDrivers() {
  const drivers = await DriverModel.find().lean();
  let fixed = 0;
  let skipped = 0;

  for (const driver of drivers) {
    if (!driver.team_id) {
      skipped++;
      console.info(`  skip driver "${driver.name}" — no team_id`);
      continue;
    }

    const team = await TeamModel.findById(driver.team_id).lean();
    if (!team) {
      skipped++;
      console.info(`  skip driver "${driver.name}" — team not found (${driver.team_id})`);
      continue;
    }

    if (idsEqual(driver.sport_id, team.sport_id)) {
      continue;
    }

    console.info(
      `  driver "${driver.name}": sport_id ${driver.sport_id} → ${team.sport_id} (via ${team.name})`
    );

    if (!dryRun) {
      await DriverModel.updateOne({ _id: driver._id }, { sport_id: team.sport_id });
    }
    fixed++;
  }

  return { fixed, skipped };
}

async function repairDriverLeaderboards() {
  const entries = await DriverLeaderboardModel.find().lean();
  let fixed = 0;
  let skipped = 0;

  for (const entry of entries) {
    const driver = await DriverModel.findById(entry.driver_id).lean();
    if (!driver?.sport_id) {
      skipped++;
      console.info(`  skip driver leaderboard ${entry._id} — driver/sport not found`);
      continue;
    }

    if (idsEqual(entry.sport_id, driver.sport_id)) {
      continue;
    }

    console.info(
      `  driver leaderboard ${entry._id}: sport_id ${entry.sport_id} → ${driver.sport_id}`
    );

    if (!dryRun) {
      await DriverLeaderboardModel.updateOne({ _id: entry._id }, { sport_id: driver.sport_id });
    }
    fixed++;
  }

  return { fixed, skipped };
}

async function repairTeamLeaderboards() {
  const entries = await TeamLeaderboardModel.find().lean();
  let fixed = 0;
  let skipped = 0;

  for (const entry of entries) {
    const team = await TeamModel.findById(entry.team_id).lean();
    if (!team?.sport_id) {
      skipped++;
      console.info(`  skip team leaderboard ${entry._id} — team/sport not found`);
      continue;
    }

    if (idsEqual(entry.sport_id, team.sport_id)) {
      continue;
    }

    console.info(`  team leaderboard ${entry._id}: sport_id ${entry.sport_id} → ${team.sport_id}`);

    if (!dryRun) {
      await TeamLeaderboardModel.updateOne({ _id: entry._id }, { sport_id: team.sport_id });
    }
    fixed++;
  }

  return { fixed, skipped };
}

async function main() {
  const uri = process.env.CN_MONGODB_URI ?? process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Set CN_MONGODB_URI or MONGODB_URI before running repair.");
  }

  await mongoose.connect(uri);
  console.info(`Connected to MongoDB${dryRun ? " (dry-run)" : ""}.`);

  const sports = await SportModel.countDocuments();
  const teams = await TeamModel.countDocuments();
  const drivers = await DriverModel.countDocuments();
  console.info(`Collections: ${sports} sports, ${teams} teams, ${drivers} drivers`);

  const orphanedBefore = {
    drivers: await countOrphanedSportIds("drivers"),
    driverLeaderboards: await countOrphanedSportIds("driver_leaderboards"),
    teamLeaderboards: await countOrphanedSportIds("team_leaderboards"),
  };
  console.info("Orphaned sport_id before:", orphanedBefore);

  console.info("\nRepairing drivers...");
  const driverResult = await repairDrivers();

  console.info("\nRepairing driver leaderboards...");
  const driverLbResult = await repairDriverLeaderboards();

  console.info("\nRepairing team leaderboards...");
  const teamLbResult = await repairTeamLeaderboards();

  const orphanedAfter = dryRun
    ? orphanedBefore
    : {
        drivers: await countOrphanedSportIds("drivers"),
        driverLeaderboards: await countOrphanedSportIds("driver_leaderboards"),
        teamLeaderboards: await countOrphanedSportIds("team_leaderboards"),
      };

  console.info("\nSummary:");
  console.info(`  drivers fixed:              ${driverResult.fixed} (skipped: ${driverResult.skipped})`);
  console.info(
    `  driver leaderboards fixed:  ${driverLbResult.fixed} (skipped: ${driverLbResult.skipped})`
  );
  console.info(
    `  team leaderboards fixed:    ${teamLbResult.fixed} (skipped: ${teamLbResult.skipped})`
  );
  console.info("Orphaned sport_id after:", orphanedAfter);

  if (!dryRun && Object.values(orphanedAfter).some((count) => count > 0)) {
    throw new Error("Repair completed but orphaned references remain.");
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  void mongoose.disconnect();
  process.exit(1);
});
