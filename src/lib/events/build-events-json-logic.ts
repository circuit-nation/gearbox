import type { SportsType } from "@/lib/circuit-nation/types";
import { resolveCircuitName } from "./circuit-aliases";
import { localToUtc } from "./local-to-utc";
import type { SeedRefsCircuit } from "./seed-refs";

export type PortableEvent = {
  id: string;
  title: string;
  round: number;
  type: string;
  sport_type: SportsType;
  circuit_name: string;
  event_start_at_local: string;
  event_end_at_local: string;
  timezone: string;
  links?: { watch_url?: string; watch_label?: string; youtube?: string };
};

export type BuiltEvent = {
  seed_key: string;
  title: string;
  round: number;
  type: string;
  sport_id: string;
  circuit_id: string;
  event_start_at: string;
  event_end_at: string;
  links: {
    watch_url?: string;
    watch_label?: string;
    youtube?: string;
  };
};

const DEFAULT_LINKS: Partial<
  Record<SportsType, { watch_url: string; watch_label: string }>
> = {
  formula: {
    watch_url: "https://f1tv.formula1.com",
    watch_label: "Watch on F1 TV",
  },
  motogp: {
    watch_url: "https://www.motogp.com/en/video",
    watch_label: "Watch on MotoGP",
  },
  endurance: {
    watch_url: "https://www.fiawec.com/en/live",
    watch_label: "Watch on WEC TV",
  },
};

export function buildCircuitLookup(circuits: SeedRefsCircuit[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const circuit of circuits) {
    lookup.set(`${circuit.sport_type}::${circuit.name}`, circuit._id);
  }
  return lookup;
}

export function resolveSportId(
  sports: Partial<Record<SportsType, string>>,
  sport_type: SportsType
): string {
  const sportId = sports[sport_type];
  if (!sportId) {
    throw new Error(`No sport_id found for sport_type "${sport_type}".`);
  }
  return sportId;
}

const BUILD_CIRCUIT_ALIASES: Record<string, string> = {
  "Jeddah Corniche Circuit": "Jeddah Circuit",
  "Madrid Street Circuit (IFEMA)": "Madring Street Circuit",
};

function resolveCircuitLookupName(sport_type: SportsType, circuit_name: string): string {
  const trimmed = circuit_name.trim();
  const aliased = BUILD_CIRCUIT_ALIASES[trimmed] ?? resolveCircuitName(trimmed);

  if (sport_type === "motogp" && aliased === "Lusail International Circuit") {
    return "Losail International Circuit";
  }

  return aliased;
}

function circuitLookupKey(sport_type: SportsType, circuit_name: string): string {
  return `${sport_type}::${resolveCircuitLookupName(sport_type, circuit_name)}`;
}

function resolveLinks(
  sport_type: SportsType,
  links?: PortableEvent["links"]
): BuiltEvent["links"] {
  const defaults = DEFAULT_LINKS[sport_type];
  if (!defaults) {
    throw new Error(`No default links configured for sport_type "${sport_type}".`);
  }

  return {
    watch_url: links?.watch_url ?? defaults.watch_url,
    watch_label: links?.watch_label ?? defaults.watch_label,
    ...(links?.youtube ? { youtube: links.youtube } : {}),
  };
}

export function transformPortableEvent(
  event: PortableEvent,
  lookup: Map<string, string>,
  sports: Partial<Record<SportsType, string>>
): BuiltEvent {
  const sport_id = resolveSportId(sports, event.sport_type);
  const resolvedName = resolveCircuitLookupName(event.sport_type, event.circuit_name);
  const lookupKey = circuitLookupKey(event.sport_type, event.circuit_name);
  const circuit_id = lookup.get(lookupKey);

  if (!circuit_id) {
    throw new Error(
      `Unresolved circuit for ${event.sport_type}::${resolvedName} (event id "${event.id}").`
    );
  }

  let event_start_at: string;
  let event_end_at: string;

  try {
    event_start_at = localToUtc(event.event_start_at_local, event.timezone);
    event_end_at = localToUtc(event.event_end_at_local, event.timezone);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid timezone for event "${event.id}": ${message}`);
  }

  return {
    seed_key: event.id,
    title: event.title,
    round: event.round,
    type: event.type,
    sport_id,
    circuit_id,
    event_start_at,
    event_end_at,
    links: resolveLinks(event.sport_type, event.links),
  };
}

export function assertNoDuplicateSeedKeys(seedKeys: string[]): void {
  const seen = new Set<string>();
  for (const key of seedKeys) {
    if (seen.has(key)) {
      throw new Error(`Duplicate seed_key: "${key}"`);
    }
    seen.add(key);
  }
}

export function transformAllPortableEvents(
  portableEvents: PortableEvent[],
  lookup: Map<string, string>,
  sports: Partial<Record<SportsType, string>>
): BuiltEvent[] {
  const events: BuiltEvent[] = [];
  const unresolved = new Set<string>();

  for (const event of portableEvents) {
    try {
      events.push(transformPortableEvent(event, lookup, sports));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Unresolved circuit for")) {
        const pair = message.match(/Unresolved circuit for ([^(]+)/)?.[1]?.trim();
        if (pair) {
          unresolved.add(pair);
        }
      } else {
        throw error;
      }
    }
  }

  if (unresolved.size > 0) {
    const lines = [...unresolved].sort().map((pair) => `  - ${pair}`);
    throw new Error(`Unresolved circuit lookups:\n${lines.join("\n")}`);
  }

  return events;
}
