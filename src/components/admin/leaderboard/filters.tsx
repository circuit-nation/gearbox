import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SportOption = {
  _id: string;
  name: string;
};

type LeaderboardFiltersProps = {
  sports?: SportOption[];
  filterSport: string;
  filterTeam: string;
  onFilterSportChange: (value: string) => void;
  onFilterTeamChange: (value: string) => void;
  filterName?: string;
  onFilterNameChange?: (value: string) => void;
  showNameFilter?: boolean;
};

export function LeaderboardFilters({
  sports,
  filterSport,
  filterTeam,
  onFilterSportChange,
  onFilterTeamChange,
  filterName,
  onFilterNameChange,
  showNameFilter = false,
}: LeaderboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
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
        <Input
          id="leaderboard-filter-team"
          placeholder="Filter by team..."
          value={filterTeam}
          onChange={(event) => onFilterTeamChange(event.target.value)}
        />
      </div>
    </div>
  );
}
