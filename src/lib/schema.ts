/**
 * TypeScript types for database collections
 */

export type SportsType =
  | "formula"
  | "feeder"
  | "indycar"
  | "motogp"
  | "superbike"
  | "endurance"
  | "off-road"
  | "nascar";

export type EventType =
  | "race"
  | "qualifying"
  | "practice"
  | "sprint"
  | "test"
  | "shootout"
  | "warmup"
  | "demo"
  | "news"
  | "announcement"
  | "update"
  | "watch-party";

export type Location = [number, number];

export interface EventLinks {
  convexId: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  x?: string;
  sources?: string[];
}

export interface Sport {
  convexId: string;
  name: string;
  logo: string;
  color: string;
  type: SportsType;
  tags?: string[];
}

export interface Event {
  convexId: string;
  id: string;
  title: string;
  round: number;
  type: EventType;
  circuit_id: string; // Reference to Circuit.convexId
  links_id?: string; // Reference to EventLinks.convexId (optional)
  sport_id: string; // Reference to Sport.convexId
  event_start_at: string; // ISO Date String
  event_end_at: string; // ISO Date String
  images?: string[];
}

export interface Circuit {
  convexId: string;
  id: string;
  name: string;
  location_str: string;
  country: string;
  country_code: string;
  location?: Location; // [longitude, latitude]
  sport_id: string; // Reference to Sport.convexId
  image?: string;
  logo?: string;
  color?: string;
  length_km?: number;
  turns?: number;
  laps?: number;
  lap_record?: string;
  lap_record_holder?: string;
  lap_record_year?: number;
  track_type?: "permanent" | "street" | "temporary" | "mixed";
  direction?: "clockwise" | "counterclockwise";
  year_opened?: number;
  tags?: string[];
  official_website?: string;
}

export interface Team {
  convexId: string;
  id: string;
  name: string;
  logo: string;
  sport: string; // Reference to Sport.convexId
  tags?: string[];
  color?: string;
}

export interface Driver {
  convexId: string;
  id: string;
  name: string;
  image: string;
  sport: string; // Reference to Sport.convexId
  tags?: string[];
}

/**
 * Helper types for creating documents (without system fields)
 */
export type CreateSport = Omit<Sport, "convexId">;
export type CreateEvent = Omit<Event, "convexId">;
export type CreateCircuit = Omit<Circuit, "convexId">;
export type CreateTeam = Omit<Team, "convexId">;
export type CreateDriver = Omit<Driver, "convexId">;

/**
 * Parsed versions with resolved relations
 * Use these when you need to include expanded/resolved relationship data
 */
export interface EventParsed extends Event {
  links?: EventLinks;
  sportData?: Sport; // Resolved sport reference
  circuitData?: Circuit; // Resolved circuit reference
}

export interface TeamParsed extends Team {
  sportData?: Sport; // Resolved sport reference
}

export interface DriverParsed extends Driver {
  sportData?: Sport; // Resolved sport reference
}

/**
 * Relationship Notes:
 *
 * - Event.sport -> Sport.convexId (Many-to-One)
 * - Team.sport -> Sport.convexId (Many-to-One)
 * - Driver.sport -> Sport.convexId (Many-to-One)
 * - Event.links_id -> EventLinks.convexId (Many-to-One, Optional)
 */
