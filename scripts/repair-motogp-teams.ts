/**
 * Fix MotoGP rider team_id assignments using visualizer/motogp_riders.json.
 *
 * Usage:
 *   pnpm repair:motogp-teams              # apply fixes
 *   pnpm repair:motogp-teams --dry-run    # report mismatches only
 *
 * Requires: CN_MONGODB_URI (or MONGODB_URI)
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { DriverModel, SportModel, TeamModel } from "@/lib/models/core.models";
import { DriverLeaderboardModel } from "@/lib/models/leaderboard.models";
import { MOTOGP_TEAM_TAG_TO_NAME } from "@/lib/circuit-nation/motogp-team-map";

config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env.production") });

const dryRun = process.argv.includes("--dry-run");

const VISUALIZER_RIDERS_PATH = path.resolve(
  process.cwd(),
  "../visualizer/motogp_riders.json"
);

type VisualizerRider = {
  name: string;
  team: string;
  number?: string;
  nationality?: string;
};

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function readVisualizerRiders(): VisualizerRider[] {
  const raw = readFileSync(VISUALIZER_RIDERS_PATH, "utf8");
  const riders = JSON.parse(raw) as VisualizerRider[];

  if (!Array.isArray(riders) || riders.length === 0) {
    throw new Error(`No riders found in ${VISUALIZER_RIDERS_PATH}`);
  }

  return riders;
}

async function main() {
  const uri = process.env.CN_MONGODB_URI ?? process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Set CN_MONGODB_URI or MONGODB_URI before running repair.");
  }

  await mongoose.connect(uri);
  console.info(`Connected to MongoDB${dryRun ? " (dry-run)" : ""}.`);

  const motogpSport = await SportModel.findOne({ type: "motogp" }).lean();
  if (!motogpSport) {
    throw new Error("MotoGP sport not found.");
  }

  const motogpTeams = await TeamModel.find({ sport_id: motogpSport._id }).lean();
  const teamIdByName = new Map(motogpTeams.map((team) => [team.name, team._id]));

  const riders = readVisualizerRiders();
  let fixed = 0;
  let skipped = 0;
  let leaderboardFixed = 0;

  for (const rider of riders) {
    const teamName = MOTOGP_TEAM_TAG_TO_NAME[rider.team];
    if (!teamName) {
      throw new Error(`Unknown team tag "${rider.team}" for rider "${rider.name}".`);
    }

    const teamId = teamIdByName.get(teamName);
    if (!teamId) {
      throw new Error(`Team "${teamName}" not found in MongoDB for rider "${rider.name}".`);
    }

    const driver = await DriverModel.findOne({
      sport_id: motogpSport._id,
      name: rider.name,
    }).lean();

    if (!driver) {
      skipped++;
      console.info(`  skip "${rider.name}" — driver not found in MongoDB`);
      continue;
    }

    if (driver.team_id?.toString() === teamId.toString()) {
      continue;
    }

    const currentTeam = driver.team_id
      ? motogpTeams.find((team) => team._id.toString() === driver.team_id?.toString())
      : null;

    console.info(
      `  "${rider.name}": ${currentTeam?.name ?? "Unassigned"} → ${teamName} (tag: ${rider.team})`
    );

    if (!dryRun) {
      await DriverModel.updateOne(
        { _id: driver._id },
        { team_id: teamId, sport_id: motogpSport._id }
      );

      const leaderboardResult = await DriverLeaderboardModel.updateMany(
        { driver_id: driver._id },
        { team_id: teamId, sport_id: motogpSport._id }
      );
      leaderboardFixed += leaderboardResult.modifiedCount;
    }

    fixed++;
  }

  console.info("\nSummary:");
  console.info(`  drivers fixed:            ${fixed} (skipped: ${skipped})`);
  console.info(`  leaderboard rows fixed:   ${leaderboardFixed}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  void mongoose.disconnect();
  process.exit(1);
});
