import { Input } from "@/components/ui/input";

type DriversFiltersProps = {
  filterName: string;
  filterSport: string;
  onFilterNameChange: (value: string) => void;
  onFilterSportChange: (value: string) => void;
};

export function DriversFilters({
  filterName,
  filterSport,
  onFilterNameChange,
  onFilterSportChange,
}: DriversFiltersProps) {
  return (
    <div className="flex items-center gap-4">
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
    </div>
  );
}
