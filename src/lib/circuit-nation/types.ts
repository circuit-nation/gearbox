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

export interface LeaderboardStats {
  rank: number;
  points: number;
  wins?: number;
  podiums?: number;
}

export interface EventLinks {
  _id: string;
  instagram?: string;
  youtube?: string;
  watch_url?: string;
  watch_label?: string;
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

export interface Team {
  _id: string;
  name: string;
  logo: string;
  color: string;
  sport_id: string;
  tags?: string[];
}

export interface Circuit {
  _id: string;
  name: string;
  location_str: string;
  country: string;
  country_code: string;
  image?: string;
  location: { latitude: number; longitude: number };
  sport_id: string;
  tags?: string[];
}

export interface Driver {
  _id: string;
  name: string;
  image: string;
  sport_id: string;
  team_id?: string | null;
  points: number;
  tags?: string[];
}

export interface Event {
  _id: string;
  title: string;
  round: number;
  type: EventType;
  circuit_id: string;
  links_id?: string | null;
  sport_id: string;
  event_start_at: string;
  event_end_at: string;
  images?: string[];
  links?: EventLinks;
}

export interface DriverLeaderboard {
  _id: string;
  year: number;
  sport_id: string;
  driver_id: string;
  team_id?: string | null;
  stats: LeaderboardStats;
  driverName?: string;
  driverImage?: string;
  teamName?: string;
}

export interface TeamLeaderboard {
  _id: string;
  year: number;
  sport_id: string;
  team_id: string;
  stats: LeaderboardStats;
  teamName?: string;
}

export type DriverLeaderboardEntry = DriverLeaderboard & {
  rank: number;
  points: number;
  name: string;
  image: string;
  team: string;
};

export type TeamLeaderboardEntry = TeamLeaderboard & {
  rank: number;
  totalPoints: number;
  team: string;
  driverCount?: number;
};

export type CreateSport = Omit<Sport, "_id">;
export type CreateTeam = Omit<Team, "_id">;
export type CreateCircuit = Omit<Circuit, "_id">;
export type CreateDriver = Omit<Driver, "_id" | "points"> & { points?: number };
export type CreateEvent = Omit<Event, "_id" | "links"> & {
  links?: Omit<EventLinks, "_id">;
};
export type UpdateEvent = Partial<CreateEvent>;
export type CreateDriverLeaderboard = Omit<
  DriverLeaderboard,
  "_id" | "driverName" | "driverImage" | "teamName"
>;
export type CreateTeamLeaderboard = Omit<TeamLeaderboard, "_id" | "teamName">;

export interface EventParsed extends Event {
  sportData?: Sport;
  circuitData?: Circuit;
}

export interface DriverParsed extends Driver {
  sportData?: Sport;
  teamData?: Team;
}
