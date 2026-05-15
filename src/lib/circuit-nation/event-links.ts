import { Types } from "mongoose";
import { EventLinksModel } from "@/lib/models/core.models";
import { toDocument, type DocWithId } from "@/lib/mongo-helpers";
import type { EventLinks } from "@/lib/circuit-nation/types";
import { eventLinksSchema } from "@/lib/circuit-nation/validators";

type EventLinksInput = {
  instagram?: string;
  youtube?: string;
  discord?: string;
  x?: string;
  sources?: string[];
};

function hasLinkValues(links?: EventLinksInput | null) {
  if (!links) {
    return false;
  }

  return Boolean(
    links.instagram?.trim() ||
    links.youtube?.trim() ||
    links.discord?.trim() ||
    links.x?.trim() ||
    links.sources?.some((source) => source.trim())
  );
}

export async function syncEventLinks(
  linksId: string | null | undefined,
  links?: EventLinksInput | null
) {
  if (!hasLinkValues(links)) {
    return linksId ?? null;
  }

  const parsed = eventLinksSchema.safeParse(links);
  if (!parsed.success) {
    throw new Error("Invalid event links payload.");
  }

  if (linksId && Types.ObjectId.isValid(linksId)) {
    const updated = await EventLinksModel.findByIdAndUpdate(linksId, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (updated) {
      return linksId;
    }
  }

  const created = await EventLinksModel.create(parsed.data);
  return created._id.toString();
}

export async function deleteEventLinks(linksId?: string | null) {
  if (!linksId || !Types.ObjectId.isValid(linksId)) {
    return;
  }

  await EventLinksModel.findByIdAndDelete(linksId);
}

export function serializeEventLinks(doc: Record<string, unknown>) {
  const linksValue = doc.links_id;

  if (!linksValue || typeof linksValue !== "object" || !("_id" in linksValue)) {
    return doc;
  }

  const links = toDocument<EventLinks>(linksValue as DocWithId);

  return {
    ...doc,
    links_id: links?._id ?? doc.links_id,
    links,
  };
}
