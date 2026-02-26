import { Input } from "@/components/ui/input";

type SportsFiltersProps = {
  filterName: string;
  filterType: string;
  onFilterNameChange: (value: string) => void;
  onFilterTypeChange: (value: string) => void;
};

export function SportsFilters({
  filterName,
  filterType,
  onFilterNameChange,
  onFilterTypeChange,
}: SportsFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <Input
        placeholder="Filter by name..."
        value={filterName}
        onChange={(event) => onFilterNameChange(event.target.value)}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by type..."
        value={filterType}
        onChange={(event) => onFilterTypeChange(event.target.value)}
        className="max-w-sm"
      />
    </div>
  );
}
