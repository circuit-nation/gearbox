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

type CircuitsFiltersProps = {
  filterName: string;
  filterCountry: string;
  filterSport: string;
  sports?: SportOption[];
  onFilterNameChange: (value: string) => void;
  onFilterCountryChange: (value: string) => void;
  onFilterSportChange: (value: string) => void;
};

export function CircuitsFilters({
  filterName,
  filterCountry,
  filterSport,
  sports,
  onFilterNameChange,
  onFilterCountryChange,
  onFilterSportChange,
}: CircuitsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="min-w-45 flex-1">
        <Label htmlFor="filter-circuit-name">Name</Label>
        <Input
          id="filter-circuit-name"
          value={filterName}
          onChange={(e) => onFilterNameChange(e.target.value)}
          placeholder="Filter by name..."
        />
      </div>
      <div className="min-w-45">
        <Label htmlFor="filter-circuit-country">Country</Label>
        <Input
          id="filter-circuit-country"
          value={filterCountry}
          onChange={(e) => onFilterCountryChange(e.target.value)}
          placeholder="Filter by country..."
        />
      </div>
      <div className="min-w-45">
        <Label htmlFor="filter-circuit-sport">Sport</Label>
        <Select
          value={filterSport || "all"}
          onValueChange={(value) => onFilterSportChange(value === "all" ? "" : value)}
        >
          <SelectTrigger id="filter-circuit-sport">
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
    </div>
  );
}
