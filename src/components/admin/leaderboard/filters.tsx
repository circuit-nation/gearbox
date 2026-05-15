import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SportOption = {
  _id: string;
  name: string;
};

type TeamOption = {
  _id: string;
  name: string;
};

type LeaderboardFiltersProps = {
  sports?: SportOption[];
  teams?: TeamOption[];
  filterYear: number;
  filterSport: string;
  filterTeam: string;
  onFilterYearChange: (value: number) => void;
  onFilterSportChange: (value: string) => void;
  onFilterTeamChange: (value: string) => void;
  filterName?: string;
  onFilterNameChange?: (value: string) => void;
  showNameFilter?: boolean;
  showTeamSelect?: boolean;
};

export function LeaderboardFilters({
  sports,
  teams,
  filterYear,
  filterSport,
  filterTeam,
  onFilterYearChange,
  onFilterSportChange,
  onFilterTeamChange,
  filterName,
  onFilterNameChange,
  showNameFilter = false,
  showTeamSelect = false,
}: LeaderboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-28">
        <Label htmlFor="leaderboard-filter-year">Year</Label>
        <Input
          id="leaderboard-filter-year"
          type="number"
          min={2000}
          max={2100}
          value={filterYear}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            if (Number.isFinite(parsed)) {
              onFilterYearChange(parsed);
            }
          }}
        />
      </div>

      {showNameFilter && onFilterNameChange ? (
        <div className="min-w-56">
          <Label htmlFor="leaderboard-filter-name">Driver Name</Label>
          <Input
            id="leaderboard-filter-name"
            placeholder="Filter by driver..."
            value={filterName || ""}
            onChange={(event) => onFilterNameChange(event.target.value)}
          />
        </div>
      ) : null}

      <div className="min-w-56">
        <Label htmlFor="leaderboard-filter-sport">Sport</Label>
        <Select
          value={filterSport || "all"}
          onValueChange={(value) => onFilterSportChange(value === "all" ? "" : value)}
        >
          <SelectTrigger id="leaderboard-filter-sport">
            <SelectValue placeholder="All sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sports</SelectItem>
            {sports?.map((sport) => (
              <SelectItem key={sport._id} value={sport._id}>
                {sport.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-56">
        <Label htmlFor="leaderboard-filter-team">Team</Label>
        {showTeamSelect ? (
          <Select
            value={filterTeam || "all"}
            onValueChange={(value) => onFilterTeamChange(value === "all" ? "" : value)}
          >
            <SelectTrigger id="leaderboard-filter-team">
              <SelectValue placeholder="All teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              {teams?.map((team) => (
                <SelectItem key={team._id} value={team._id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="leaderboard-filter-team"
            placeholder="Filter by team..."
            value={filterTeam}
            onChange={(event) => onFilterTeamChange(event.target.value)}
          />
        )}
      </div>
    </div>
  );
}
