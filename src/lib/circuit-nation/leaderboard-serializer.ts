import { toDocument, type DocWithId } from "@/lib/mongo-helpers";
import type { DriverLeaderboardEntry, TeamLeaderboardEntry } from "@/lib/circuit-nation/types";

type PopulatedRef = { _id?: unknown; name?: string; image?: string } | string | null | undefined;

function refName(value: PopulatedRef) {
  if (!value || typeof value === "string") {
    return undefined;
  }

  return value.name;
}

function refImage(value: PopulatedRef) {
  if (!value || typeof value === "string") {
    return undefined;
  }

  return value.image;
}

function refId(value: PopulatedRef) {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value._id) {
    return String(value._id);
  }

  return undefined;
}

export function serializeDriverLeaderboardEntry(doc: Record<string, unknown>) {
  const base = toDocument(doc as DocWithId) as (Record<string, unknown> & { _id: string }) | null;
  if (!base) {
    return null;
  }

  const stats = doc.stats as DriverLeaderboardEntry["stats"];
  const driverName =
    refName(doc.driver_id as PopulatedRef) ?? (base.driverName as string | undefined);
  const driverImage =
    refImage(doc.driver_id as PopulatedRef) ?? (base.driverImage as string | undefined);
  const teamName = refName(doc.team_id as PopulatedRef) ?? (base.teamName as string | undefined);

  return {
    _id: base._id,
    year: doc.year as number,
    sport_id: refId(doc.sport_id as PopulatedRef) ?? (base.sport_id as string),
    driver_id: refId(doc.driver_id as PopulatedRef) ?? (base.driver_id as string),
    team_id:
      refId(doc.team_id as PopulatedRef) ?? (base.team_id as string | null | undefined) ?? null,
    stats,
    driverName,
    driverImage,
    teamName,
    rank: stats.rank,
    points: stats.points,
    name: driverName ?? "Unknown driver",
    image: driverImage ?? "",
    team: teamName ?? "Unassigned",
  } satisfies DriverLeaderboardEntry;
}

export function serializeTeamLeaderboardEntry(doc: Record<string, unknown>) {
  const base = toDocument(doc as DocWithId) as (Record<string, unknown> & { _id: string }) | null;
  if (!base) {
    return null;
  }

  const stats = doc.stats as TeamLeaderboardEntry["stats"];
  const teamName = refName(doc.team_id as PopulatedRef) ?? (base.teamName as string | undefined);

  return {
    _id: base._id,
    year: doc.year as number,
    sport_id: refId(doc.sport_id as PopulatedRef) ?? (base.sport_id as string),
    team_id: refId(doc.team_id as PopulatedRef) ?? (base.team_id as string),
    stats,
    teamName,
    rank: stats.rank,
    totalPoints: stats.points,
    team: teamName ?? "Unknown team",
  } satisfies TeamLeaderboardEntry;
}
