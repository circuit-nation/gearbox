import { Input } from "@/components/ui/input";

type DriversFiltersProps = {
  filterName: string;
  filterSport: string;
  filterTeam: string;
  onFilterNameChange: (value: string) => void;
  onFilterSportChange: (value: string) => void;
  onFilterTeamChange: (value: string) => void;
};

export function DriversFilters({
  filterName,
  filterSport,
  filterTeam,
  onFilterNameChange,
  onFilterSportChange,
  onFilterTeamChange,
}: DriversFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        placeholder="Filter by name..."
        value={filterName}
        onChange={(event) => onFilterNameChange(event.target.value)}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by sport..."
        value={filterSport}
        onChange={(event) => onFilterSportChange(event.target.value)}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by team..."
        value={filterTeam}
        onChange={(event) => onFilterTeamChange(event.target.value)}
        className="max-w-sm"
      />
    </div>
  );
}
