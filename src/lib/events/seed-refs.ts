import { connectToDatabase } from "@/lib/mongodb";
import { CircuitModel, SportModel } from "@/lib/models/core.models";
import type { SportsType } from "@/lib/circuit-nation/types";

export type SeedRefsCircuit = {
  _id: string;
  name: string;
  sport_type: SportsType;
};

export type SeedRefsPayload = {
  sports: Partial<Record<SportsType, string>>;
  circuits: SeedRefsCircuit[];
};

export async function fetchSeedRefs(): Promise<SeedRefsPayload> {
  await connectToDatabase();

  const sportsDocs = await SportModel.find({}).lean();
  const sports: Partial<Record<SportsType, string>> = {};
  for (const doc of sportsDocs) {
    sports[doc.type as SportsType] = String(doc._id);
  }

  const circuitDocs = await CircuitModel.find({}).populate("sport_id").lean();
  const circuits: SeedRefsCircuit[] = circuitDocs.map((doc) => {
    const sport = doc.sport_id as { type?: SportsType } | null;
    return {
      _id: String(doc._id),
      name: doc.name,
      sport_type: (sport?.type ?? "formula") as SportsType,
    };
  });

  return { sports, circuits };
}
