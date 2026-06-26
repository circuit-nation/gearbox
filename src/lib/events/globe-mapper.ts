import { serializeEventLinks } from "@/lib/circuit-nation/event-links";
import type { Circuit, Event, EventLinks, Sport } from "@/lib/circuit-nation/types";
import type { EventParsed } from "@/lib/circuit-nation/types";
import { toDocument, type DocWithId } from "@/lib/mongo-helpers";

export type GlobeEvent = {
  id: string;
  title: string;
  sportName: string;
  sportColor: string;
  location: string;
  circuit?: string;
  startAt: string;
  endAt: string;
  watchUrl: string;
  watchLabel: string;
};

export type EventLocation = {
  eventId: string;
  title: string;
  latitude: number;
  longitude: number;
};

export function resolveWatchFields(links?: {
  watch_url?: string;
  youtube?: string;
  watch_label?: string;
}) {
  const watchUrl = links?.watch_url?.trim() || links?.youtube?.trim() || "";
  const watchLabel = links?.watch_label?.trim() || "Watch live";
  return { watchUrl, watchLabel };
}

function readPopulatedRef<T extends object>(value: unknown): T | undefined {
  if (!value || typeof value !== "object" || !("_id" in value)) {
    return undefined;
  }

  return toDocument<T>(value as DocWithId) ?? undefined;
}

export function parsePopulatedEvent(doc: Record<string, unknown>): EventParsed | null {
  const base = toDocument<Event>(doc as DocWithId);
  if (!base) {
    return null;
  }

  const withLinks = serializeEventLinks(doc) as Record<string, unknown> & {
    links?: EventLinks;
  };

  return {
    ...base,
    event_start_at: new Date(base.event_start_at).toISOString(),
    event_end_at: new Date(base.event_end_at).toISOString(),
    sportData: readPopulatedRef<Sport>(doc.sport_id),
    circuitData: readPopulatedRef<Circuit>(doc.circuit_id),
    links: withLinks.links,
  };
}

export function mapEventToGlobeEvent(event: EventParsed): GlobeEvent {
  const { watchUrl, watchLabel } = resolveWatchFields(event.links);
  return {
    id: event._id,
    title: event.title,
    sportName: event.sportData?.name ?? "",
    sportColor: event.sportData?.color ?? "",
    location: event.circuitData?.location_str ?? "",
    circuit: event.circuitData?.name,
    startAt: event.event_start_at,
    endAt: event.event_end_at,
    watchUrl,
    watchLabel,
  };
}

export function mapEventToLocation(event: EventParsed): EventLocation | null {
  const latitude = event.circuitData?.location?.latitude ?? 0;
  const longitude = event.circuitData?.location?.longitude ?? 0;

  if (latitude === 0 && longitude === 0) {
    return null;
  }

  return {
    eventId: event._id,
    title: event.title,
    latitude,
    longitude,
  };
}
