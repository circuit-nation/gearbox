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
  _id: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  x?: string;
  sources?: string[];
}

export interface Sport {
  _id: string;
  name: string;
  logo: string;
  color: string;
  type: SportsType;
  tags?: string[];
}

export interface Event {
  _id: string;
  id: string;
  title: string;
  round: number;
  type: EventType;
  circuit_id: string; // Reference to Circuit._id
  links_id?: string; // Reference to EventLinks._id (optional)
  sport_id: string; // Reference to Sport._id
  event_start_at: string; // ISO Date String
  event_end_at: string; // ISO Date String
  images?: string[];
}

export interface Circuit {
  _id: string;
  id: string;
  name: string;
  location_str: string;
  country: string;
  country_code: string;
  location?: Location; // [longitude, latitude]
  sport_id: string; // Reference to Sport._id
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
  _id: string;
  id: string;
  name: string;
  logo: string;
  sport: string; // Reference to Sport._id
  tags?: string[];
  color?: string;
}

export interface Driver {
  _id: string;
  id: string;
  name: string;
  image: string;
  sport: string; // Reference to Sport._id
  tags?: string[];
}

/**
 * Helper types for creating documents (without system fields)
 */
export type CreateSport = Omit<Sport, "_id">;
export type CreateEvent = Omit<Event, "_id">;
export type CreateCircuit = Omit<Circuit, "_id">;
export type CreateTeam = Omit<Team, "_id">;
export type CreateDriver = Omit<Driver, "_id">;

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
 * - Event.sport -> Sport._id (Many-to-One)
 * - Team.sport -> Sport._id (Many-to-One)
 * - Driver.sport -> Sport._id (Many-to-One)
 * - Event.links_id -> EventLinks._id (Many-to-One, Optional)
 */
