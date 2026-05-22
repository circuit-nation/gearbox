import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose, { Types } from "mongoose";
import { CircuitModel, DriverModel, SportModel, TeamModel } from "@/lib/models/core.models";
import {
  circuitSchema,
  driverSchema,
  sportSchema,
  teamSchema,
} from "@/lib/circuit-nation/validators";
import type { SportsType } from "@/lib/circuit-nation/types";

// config({ path: path.resolve(process.cwd(), ".env") });
// config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env.production") });

const DATA_DIR = path.resolve(process.cwd(), "src/data");

/** Legacy Appwrite sport ids from seed JSON → sport `type` in sports.json */
const LEGACY_SPORT_TYPE: Record<string, SportsType> = {
  jd7c00e7wccftqrp7a9m2z7qvn8135b2: "formula",
  jd7f4fekhc8chxr1mt4vvjex5h812qea: "motogp",
};

/** circuits.json: indices 0–22 are MotoGP, 23+ are Formula 1 */
const MOTOGP_CIRCUIT_MAX_INDEX = 22;

type RawSport = {
  name: string;
  logo: string;
  color: string;
  type: SportsType;
  tags?: string[];
};

type RawCircuit = {
  name: string;
  location_str: string;
  country: string;
  country_code: string;
  location: [number, number];
};

type RawTeam = {
  id: string;
  name: string;
  logo: string;
  color: string;
  sport: string;
  tags?: string[];
};

type RawDriver = {
  id: string;
  name: string;
  image: string;
  sport: string;
  tags?: string[];
};

type DriverImageEntry = {
  name: string;
  image: string;
};

function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findTeamLegacyId(tag: string, teams: RawTeam[]): string | null {
  const hint = normalizeKey(tag);

  for (const team of teams) {
    if (normalizeKey(team.name).includes(hint) || hint.includes(normalizeKey(team.name))) {
      return team.id;
    }

    for (const teamTag of team.tags ?? []) {
      const normalizedTag = normalizeKey(teamTag);
      if (normalizedTag.includes(hint) || hint.includes(normalizedTag)) {
        return team.id;
      }
    }
  }

  return null;
}

async function main() {
  const reset = process.argv.includes("--reset");
  const uri = process.env.CN_MONGODB_URI ?? process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Set CN_MONGODB_URI or MONGODB_URI in .env before seeding.");
  }

  await mongoose.connect(uri);
  console.info("Connected to MongoDB.");

  if (reset) {
    console.info("Clearing sports, teams, circuits, and drivers...");
    await Promise.all([
      DriverModel.deleteMany({}),
      CircuitModel.deleteMany({}),
      TeamModel.deleteMany({}),
      SportModel.deleteMany({}),
    ]);
  }

  const sportsRaw = readJson<RawSport[]>("sports.json");
  const circuitsRaw = readJson<RawCircuit[]>("circuits.json");
  const teamsRaw = [
    ...readJson<RawTeam[]>("f1_teams.json"),
    ...readJson<RawTeam[]>("motogp_teams.json"),
  ];
  const driversRaw = [
    ...readJson<RawDriver[]>("f1_drivers.json"),
    ...readJson<RawDriver[]>("motogp_riders.json"),
  ];
  const driverImages = readJson<DriverImageEntry[]>("driver_images.json");
  const driverImageByKey = new Map(
    driverImages.map((entry) => [normalizeKey(entry.name), entry.image])
  );

  const sportIdByType = new Map<SportsType, Types.ObjectId>();
  const sportIdByLegacy = new Map<string, Types.ObjectId>();

  console.info(`Seeding ${sportsRaw.length} sports...`);
  for (const raw of sportsRaw) {
    const parsed = sportSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid sport "${raw.name}": ${parsed.error.message}`);
    }

    const document = await SportModel.create(parsed.data);
    sportIdByType.set(raw.type, document._id);
  }

  for (const [legacyId, sportType] of Object.entries(LEGACY_SPORT_TYPE)) {
    const sportId = sportIdByType.get(sportType);
    if (!sportId) {
      throw new Error(`Missing sport for type "${sportType}".`);
    }
    sportIdByLegacy.set(legacyId, sportId);
  }

  const teamIdByLegacy = new Map<string, Types.ObjectId>();

  console.info(`Seeding ${teamsRaw.length} teams...`);
  for (const raw of teamsRaw) {
    const sport_id = sportIdByLegacy.get(raw.sport);
    if (!sport_id) {
      throw new Error(`Unknown sport on team "${raw.name}": ${raw.sport}`);
    }

    const parsed = teamSchema.safeParse({
      name: raw.name,
      logo: raw.logo,
      color: raw.color,
      sport_id: sport_id.toString(),
      tags: raw.tags,
    });

    if (!parsed.success) {
      throw new Error(`Invalid team "${raw.name}": ${parsed.error.message}`);
    }

    const document = await TeamModel.create(parsed.data);
    teamIdByLegacy.set(raw.id, document._id);
  }

  console.info(`Seeding ${circuitsRaw.length} circuits...`);
  for (const [index, raw] of circuitsRaw.entries()) {
    const sportType: SportsType = index <= MOTOGP_CIRCUIT_MAX_INDEX ? "motogp" : "formula";
    const sport_id = sportIdByType.get(sportType);
    if (!sport_id) {
      throw new Error(`Missing sport for type "${sportType}".`);
    }

    const [longitude, latitude] = raw.location;
    const parsed = circuitSchema.safeParse({
      name: raw.name,
      location_str: raw.location_str,
      country: raw.country,
      country_code: raw.country_code,
      image: "",
      location: { latitude, longitude },
      sport_id: sport_id.toString(),
    });

    if (!parsed.success) {
      throw new Error(`Invalid circuit "${raw.name}": ${parsed.error.message}`);
    }

    await CircuitModel.create(parsed.data);
  }

  console.info(`Seeding ${driversRaw.length} drivers...`);
  for (const raw of driversRaw) {
    const sport_id = sportIdByLegacy.get(raw.sport);
    if (!sport_id) {
      throw new Error(`Unknown sport on driver "${raw.name}": ${raw.sport}`);
    }

    const sportTeams = teamsRaw.filter((team) => team.sport === raw.sport);
    const teamLegacyId = raw.tags?.[0] ? findTeamLegacyId(raw.tags[0], sportTeams) : null;
    const team_id = teamLegacyId ? teamIdByLegacy.get(teamLegacyId) : null;

    const image = driverImageByKey.get(normalizeKey(raw.name)) ?? raw.image;

    const parsed = driverSchema.safeParse({
      name: raw.name,
      image,
      sport_id: sport_id.toString(),
      team_id: team_id?.toString() ?? null,
      points: 0,
      tags: raw.tags,
    });

    if (!parsed.success) {
      throw new Error(`Invalid driver "${raw.name}": ${parsed.error.message}`);
    }

    await DriverModel.create(parsed.data);
  }

  const [sports, teams, circuits, drivers] = await Promise.all([
    SportModel.countDocuments(),
    TeamModel.countDocuments(),
    CircuitModel.countDocuments(),
    DriverModel.countDocuments(),
  ]);

  console.info("Seed complete.");
  console.info(`  sports:   ${sports}`);
  console.info(`  teams:    ${teams}`);
  console.info(`  circuits: ${circuits}`);
  console.info(`  drivers:  ${drivers}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  void mongoose.disconnect();
  process.exit(1);
});
