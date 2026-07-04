import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose, { Types } from "mongoose";
import { circuitSchema } from "@/lib/circuit-nation/validators";
import { CircuitModel, SportModel } from "@/lib/models/core.models";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env.production") });

const DATA_PATH = path.resolve(process.cwd(), "src/data/wec_circuits.json");

type RawWecCircuit = {
  name: string;
  location_str: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
};

function readWecCircuits(): RawWecCircuit[] {
  const raw = JSON.parse(readFileSync(DATA_PATH, "utf8")) as RawWecCircuit[];

  if (!Array.isArray(raw)) {
    throw new Error("wec_circuits.json must be an array of circuit definitions.");
  }

  return raw;
}

async function main() {
  const uri = process.env.CN_MONGODB_URI ?? process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Set CN_MONGODB_URI or MONGODB_URI before seeding WEC circuits.");
  }

  await mongoose.connect(uri);
  console.info("Connected to MongoDB.");

  const enduranceSport = await SportModel.findOne({ type: "endurance" }).lean();
  if (!enduranceSport) {
    console.error('No sport with type "endurance" found in MongoDB. Seed sports first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const sport_id = enduranceSport._id as Types.ObjectId;
  const circuits = readWecCircuits();
  let created = 0;
  let updated = 0;

  console.info(`Seeding ${circuits.length} WEC circuits under endurance sport...`);

  for (const raw of circuits) {
    const parsed = circuitSchema.safeParse({
      name: raw.name,
      location_str: raw.location_str,
      country: raw.country,
      country_code: raw.country_code,
      image: "",
      location: {
        latitude: raw.latitude,
        longitude: raw.longitude,
      },
      sport_id: sport_id.toString(),
    });

    if (!parsed.success) {
      throw new Error(`Invalid circuit "${raw.name}": ${parsed.error.message}`);
    }

    const existing = await CircuitModel.findOne({
      name: raw.name,
      sport_id,
    }).lean();

    await CircuitModel.findOneAndUpdate(
      { name: raw.name, sport_id },
      { $set: { ...parsed.data, sport_id } },
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    if (existing) {
      updated += 1;
      console.info(`Updated circuit: ${raw.name}`);
    } else {
      created += 1;
      console.info(`Created circuit: ${raw.name}`);
    }
  }

  const total = await CircuitModel.countDocuments({ sport_id });
  console.info("WEC circuits seed complete.");
  console.info(`  created: ${created}`);
  console.info(`  updated: ${updated}`);
  console.info(`  endurance circuits total: ${total}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  void mongoose.disconnect();
  process.exit(1);
});
