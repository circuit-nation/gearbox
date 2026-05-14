import { connectToDatabase } from "@/lib/mongodb";
import { TierNationEntitySubmissionModel, TierNationListSubmissionModel } from "@/lib/models";
import { normalizeStoredImageForDb } from "@/lib/tier-nation/tier-nation-image-payload";

type EntityInput = {
  name?: unknown;
  team?: unknown;
  tags?: unknown;
  description?: unknown;
  imageUrl?: unknown;
};

function normalizeEntityPayload(ent: EntityInput) {
  const tags = Array.isArray(ent.tags) ? ent.tags.map((t) => String(t)) : [];
  return {
    name: String(ent.name ?? "").trim(),
    team: ent.team != null ? String(ent.team) : "",
    tags,
    description: ent.description != null ? String(ent.description) : "",
    image: normalizeStoredImageForDb(ent.imageUrl != null ? String(ent.imageUrl) : undefined),
  };
}

export async function persistTierNationListSubmission(
  requestBody: Record<string, unknown>,
  createdList: { id: string; name?: string }
) {
  try {
    await connectToDatabase();
    const name = String(createdList.name ?? requestBody.name ?? "").trim() || "Untitled list";
    const coverImage = normalizeStoredImageForDb(
      requestBody.coverImage != null ? String(requestBody.coverImage) : undefined
    );
    await TierNationListSubmissionModel.findOneAndUpdate(
      { listId: createdList.id },
      { $set: { listId: createdList.id, name, coverImage } },
      { upsert: true }
    );
  } catch (e) {
    console.error("[tier-nation] persist list submission failed", e);
  }
}

export async function persistTierNationEntitySubmissions(
  listId: string | null,
  source: "standalone" | "list",
  requestBody: Record<string, unknown>
) {
  try {
    const raw = requestBody.entities;
    if (!Array.isArray(raw) || raw.length === 0) {
      return;
    }
    await connectToDatabase();
    const docs = raw
      .map((ent) => normalizeEntityPayload(ent as EntityInput))
      .filter((d) => d.name.length > 0)
      .map((d) => ({
        listId,
        name: d.name,
        team: d.team,
        tags: d.tags,
        description: d.description,
        image: d.image,
        source,
      }));
    if (docs.length) {
      await TierNationEntitySubmissionModel.insertMany(docs);
    }
  } catch (e) {
    console.error("[tier-nation] persist entity submissions failed", e);
  }
}
