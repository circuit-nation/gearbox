/**
 * TypeScript types for Appwrite database collections
 */

export type SportsType =
  | "formula"
  | "feeder"
  | "indycar"
  | "motogp"
  | "superbike"
  | "endurance"
  | "off road"
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
  | "watch party";

export type Location = [number, number];

export interface EventLinks {
  instagram?: string;
  youtube?: string;
  discord?: string;
  x?: string;
  sources?: string[];
}

export interface Sport {
  $id: string;
  id: string;
  name: string;
  logo: string;
  color: string;
  type: SportsType;
  tags?: string[];
  $createdAt?: string;
  $updatedAt?: string;
}

export interface Event {
  $id: string;
  id: string;
  title: string;
  round: number;
  type: EventType;
  location?: Location; // GPS coordinates [lat, long] - Optional
  location_id?: string; // Reference to event_locations collection (if using separate location collection)
  links_id?: string; // Reference to event_links collection (if using separate links collection)
  location_str: string; // Human-readable location string
  sport: string; // Reference to Sport.$id
  country_code: string;
  country: string;
  event_start_at: string; // ISO Date String
  event_end_at: string; // ISO Date String
  images?: string[];
  $createdAt?: string;
  $updatedAt?: string;
}

export interface Team {
  $id: string;
  id: string;
  name: string;
  logo: string;
  sport: string; // Reference to Sport.$id
  tags?: string[];
  color?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface Driver {
  $id: string;
  id: string;
  name: string;
  image: string;
  sport: string; // Reference to Sport.$id
  tags?: string[];
  $createdAt?: string;
  $updatedAt?: string;
}

/**
 * Helper types for creating documents (without Appwrite system fields)
 */
export type CreateSport = Omit<Sport, "$id" | "$createdAt" | "$updatedAt">;
export type CreateEvent = Omit<Event, "$id" | "$createdAt" | "$updatedAt">;
export type CreateTeam = Omit<Team, "$id" | "$createdAt" | "$updatedAt">;
export type CreateDriver = Omit<Driver, "$id" | "$createdAt" | "$updatedAt">;

/**
 * Parsed versions with resolved relations
 * Use these when you need to include expanded/resolved relationship data
 */
export interface EventParsed extends Event {
  location?: Location;
  links?: EventLinks;
  sportData?: Sport; // Resolved sport reference
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
 * - Event.sport -> Sport.$id (Many-to-One)
 * - Team.sport -> Sport.$id (Many-to-One)
 * - Driver.sport -> Sport.$id (Many-to-One)
 * 
 * Optional relationships (if using separate collections):
 * - Event.location_id -> EventLocations.$id (Many-to-One, Optional)
 * - Event.links_id -> EventLinks.$id (Many-to-One, Optional)
 * 
 * For simple use cases, you can store location data directly in the location_str field
 * and skip creating separate location/links collections.
 */
