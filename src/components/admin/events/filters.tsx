import { Input } from "@/components/ui/input";

type EventsFiltersProps = {
  filterTitle: string;
  filterType: string;
  filterCircuitId: string;
  onFilterTitleChange: (value: string) => void;
  onFilterTypeChange: (value: string) => void;
  onFilterCircuitIdChange: (value: string) => void;
};

export function EventsFilters({
  filterTitle,
  filterType,
  filterCircuitId,
  onFilterTitleChange,
  onFilterTypeChange,
  onFilterCircuitIdChange,
}: EventsFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <Input
        placeholder="Filter by title..."
        value={filterTitle}
        onChange={(event) => onFilterTitleChange(event.target.value)}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by type..."
        value={filterType}
        onChange={(event) => onFilterTypeChange(event.target.value)}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by circuit ID..."
        value={filterCircuitId}
        onChange={(event) => onFilterCircuitIdChange(event.target.value)}
        className="max-w-sm"
      />
    </div>
  );
}
