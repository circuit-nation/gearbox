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
  circuit_id: string; // External circuit identifier
  links_id?: string; // Reference to EventLinks._id (optional)
  sport_id: string; // Reference to Sport._id
  event_start_at: string; // ISO Date String
  event_end_at: string; // ISO Date String
  images?: string[];
}

export interface Driver {
  _id: string;
  id: string;
  name: string;
  image: string;
  sport: string; // Reference to Sport._id
  team: string;
  points: number;
  tags?: string[];
}

export interface DriverLeaderboardEntry extends Driver {
  rank: number;
}

export interface TeamLeaderboardEntry {
  team: string;
  totalPoints: number;
  driverCount: number;
  rank: number;
}

/**
 * Helper types for creating documents (without system fields)
 */
export type CreateSport = Omit<Sport, "_id">;
export type CreateEvent = Omit<Event, "_id">;
export type CreateDriver = Omit<Driver, "_id">;

/**
 * Parsed versions with resolved relations
 * Use these when you need to include expanded/resolved relationship data
 */
export interface EventParsed extends Event {
  links?: EventLinks;
  sportData?: Sport; // Resolved sport reference
}

export interface DriverParsed extends Driver {
  sportData?: Sport; // Resolved sport reference
}

/**
 * Relationship Notes:
 *
 * - Event.sport -> Sport._id (Many-to-One)
 * - Driver.sport -> Sport._id (Many-to-One)
 * - Event.links_id -> EventLinks._id (Many-to-One, Optional)
 */
