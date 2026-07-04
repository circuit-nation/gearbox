import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SportOption = { _id: string; name: string };
type TeamOption = { _id: string; name: string; sport_id: string };

type DriversFiltersProps = {
  filterName: string;
  filterSport: string;
  filterTeam: string;
  sports?: SportOption[];
  teams?: TeamOption[];
  onFilterNameChange: (value: string) => void;
  onFilterSportChange: (value: string) => void;
  onFilterTeamChange: (value: string) => void;
};

export function DriversFilters({
  filterName,
  filterSport,
  filterTeam,
  sports,
  teams,
  onFilterNameChange,
  onFilterSportChange,
  onFilterTeamChange,
}: DriversFiltersProps) {
  const filteredTeams = filterSport
    ? (teams?.filter((team) => team.sport_id === filterSport) ?? [])
    : (teams ?? []);

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-[200px] flex-1">
        <Label htmlFor="filter-driver-name">Name</Label>
        <Input
          id="filter-driver-name"
          placeholder="Filter by name..."
          value={filterName}
          onChange={(e) => onFilterNameChange(e.target.value)}
        />
      </div>
      <div className="min-w-[180px]">
        <Label htmlFor="filter-driver-sport">Sport</Label>
        <Select
          value={filterSport || "all"}
          onValueChange={(value) => onFilterSportChange(value === "all" ? "" : value)}
        >
          <SelectTrigger id="filter-driver-sport">
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
      <div className="min-w-[180px]">
        <Label htmlFor="filter-driver-team">Team</Label>
        <Select
          value={filterTeam || "all"}
          onValueChange={(value) => onFilterTeamChange(value === "all" ? "" : value)}
        >
          <SelectTrigger id="filter-driver-team">
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {filteredTeams.map((team) => (
              <SelectItem key={team._id} value={team._id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
