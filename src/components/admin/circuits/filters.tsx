import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SportOption = {
  _id: string;
  name: string;
};

type CircuitsFiltersProps = {
  filterName: string;
  filterCountry: string;
  filterSport: string;
  onFilterNameChange: (value: string) => void;
  onFilterCountryChange: (value: string) => void;
  onFilterSportChange: (value: string) => void;
  sports?: SportOption[];
};

export function CircuitsFilters({
  filterName,
  filterCountry,
  filterSport,
  onFilterNameChange,
  onFilterCountryChange,
  onFilterSportChange,
  sports,
}: CircuitsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        placeholder="Filter by name..."
        value={filterName}
        onChange={(event) => onFilterNameChange(event.target.value)}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by country..."
        value={filterCountry}
        onChange={(event) => onFilterCountryChange(event.target.value)}
        className="max-w-sm"
      />
      <Select value={filterSport} onValueChange={onFilterSportChange}>
        <SelectTrigger className="max-w-xs">
          <SelectValue placeholder="Filter by sport" />
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
  );
}
