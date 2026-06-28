import { SportModel, TeamModel } from "@/lib/models/core.models";

type ValidationResult = { ok: true } | { ok: false; error: string };

export async function validateDriverReferences(
  sport_id: string,
  team_id?: string | null
): Promise<ValidationResult> {
  const sport = await SportModel.findById(sport_id).lean();
  if (!sport) {
    return { ok: false, error: "Sport not found." };
  }

  if (team_id) {
    const team = await TeamModel.findById(team_id).lean();
    if (!team) {
      return { ok: false, error: "Team not found." };
    }
    if (team.sport_id.toString() !== sport_id) {
      return { ok: false, error: "Team does not belong to the selected sport." };
    }
  }

  return { ok: true };
}

export async function validateTeamSportReference(sport_id: string): Promise<ValidationResult> {
  const sport = await SportModel.findById(sport_id).lean();
  if (!sport) {
    return { ok: false, error: "Sport not found." };
  }

  return { ok: true };
}
