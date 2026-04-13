import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { Circuit, CreateCircuit } from "@/lib/schema";
import { DIRECTIONS, TRACK_TYPES, parseOptionalNumber } from "./form-utils";

type SportOption = {
  _id: string;
  name: string;
};

type CircuitsCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateCircuit;
  setFormData: Dispatch<SetStateAction<CreateCircuit>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
};

type CircuitsEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Circuit>;
  setFormData: Dispatch<SetStateAction<Partial<Circuit>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
};

export function CircuitsCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
}: CircuitsCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Circuit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Circuit</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="id">ID</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., monza"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Autodromo Nazionale Monza"
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location_str}
                onChange={(e) => setFormData({ ...formData, location_str: e.target.value })}
                placeholder="Monza, Italy"
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Italy"
                required
              />
            </div>
            <div>
              <Label htmlFor="country_code">Country Code</Label>
              <Input
                id="country_code"
                value={formData.country_code}
                onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                placeholder="IT"
                required
              />
            </div>
            <div>
              <Label htmlFor="sport_id">Sport</Label>
              <Select
                value={formData.sport_id}
                onValueChange={(value) => setFormData({ ...formData, sport_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports?.map((sport) => (
                    <SelectItem key={sport._id} value={sport._id}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="length_km">Length (km)</Label>
              <Input
                id="length_km"
                type="number"
                step="0.01"
                value={formData.length_km ?? ""}
                onChange={(e) => setFormData({ ...formData, length_km: parseOptionalNumber(e.target.value) })}
                placeholder="5.79"
              />
            </div>
            <div>
              <Label htmlFor="turns">Turns</Label>
              <Input
                id="turns"
                type="number"
                value={formData.turns ?? ""}
                onChange={(e) => setFormData({ ...formData, turns: parseOptionalNumber(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="laps">Laps</Label>
              <Input
                id="laps"
                type="number"
                value={formData.laps ?? ""}
                onChange={(e) => setFormData({ ...formData, laps: parseOptionalNumber(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="track_type">Track Type</Label>
              <Select
                value={formData.track_type ?? ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    track_type: value ? (value as Circuit["track_type"]) : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select track type" />
                </SelectTrigger>
                <SelectContent>
                  {TRACK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={formData.direction ?? ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    direction: value ? (value as Circuit["direction"]) : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTIONS.map((direction) => (
                    <SelectItem key={direction} value={direction}>
                      {direction}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year_opened">Year Opened</Label>
              <Input
                id="year_opened"
                type="number"
                value={formData.year_opened ?? ""}
                onChange={(e) => setFormData({ ...formData, year_opened: parseOptionalNumber(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="official_website">Official Website</Label>
              <Input
                id="official_website"
                value={formData.official_website ?? ""}
                onChange={(e) => setFormData({ ...formData, official_website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image ?? ""}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo ?? ""}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color ?? ""}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#ff0000"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="lap_record">Lap Record</Label>
              <Input
                id="lap_record"
                value={formData.lap_record ?? ""}
                onChange={(e) => setFormData({ ...formData, lap_record: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lap_record_holder">Lap Record Holder</Label>
              <Input
                id="lap_record_holder"
                value={formData.lap_record_holder ?? ""}
                onChange={(e) => setFormData({ ...formData, lap_record_holder: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lap_record_year">Lap Record Year</Label>
              <Input
                id="lap_record_year"
                type="number"
                value={formData.lap_record_year ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, lap_record_year: parseOptionalNumber(e.target.value) })
                }
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="historic, fast"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Circuit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CircuitsEditDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
}: CircuitsEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Circuit</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="edit-id">ID</Label>
              <Input
                id="edit-id"
                value={formData.id || ""}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location_str || ""}
                onChange={(e) => setFormData({ ...formData, location_str: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={formData.country || ""}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-country-code">Country Code</Label>
              <Input
                id="edit-country-code"
                value={formData.country_code || ""}
                onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-sport">Sport</Label>
              <Select
                value={formData.sport_id || ""}
                onValueChange={(value) => setFormData({ ...formData, sport_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports?.map((sport) => (
                    <SelectItem key={sport._id} value={sport._id}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-length">Length (km)</Label>
              <Input
                id="edit-length"
                type="number"
                step="0.01"
                value={formData.length_km ?? ""}
                onChange={(e) => setFormData({ ...formData, length_km: parseOptionalNumber(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-turns">Turns</Label>
              <Input
                id="edit-turns"
                type="number"
                value={formData.turns ?? ""}
                onChange={(e) => setFormData({ ...formData, turns: parseOptionalNumber(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-laps">Laps</Label>
              <Input
                id="edit-laps"
                type="number"
                value={formData.laps ?? ""}
                onChange={(e) => setFormData({ ...formData, laps: parseOptionalNumber(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-track">Track Type</Label>
              <Select
                value={formData.track_type || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    track_type: value ? (value as Circuit["track_type"]) : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select track type" />
                </SelectTrigger>
                <SelectContent>
                  {TRACK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-direction">Direction</Label>
              <Select
                value={formData.direction || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    direction: value ? (value as Circuit["direction"]) : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTIONS.map((direction) => (
                    <SelectItem key={direction} value={direction}>
                      {direction}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-year-opened">Year Opened</Label>
              <Input
                id="edit-year-opened"
                type="number"
                value={formData.year_opened ?? ""}
                onChange={(e) => setFormData({ ...formData, year_opened: parseOptionalNumber(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-website">Official Website</Label>
              <Input
                id="edit-website"
                value={formData.official_website || ""}
                onChange={(e) => setFormData({ ...formData, official_website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={formData.image || ""}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-logo">Logo URL</Label>
              <Input
                id="edit-logo"
                value={formData.logo || ""}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                value={formData.color || ""}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="edit-lap-record">Lap Record</Label>
              <Input
                id="edit-lap-record"
                value={formData.lap_record || ""}
                onChange={(e) => setFormData({ ...formData, lap_record: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-lap-record-holder">Lap Record Holder</Label>
              <Input
                id="edit-lap-record-holder"
                value={formData.lap_record_holder || ""}
                onChange={(e) => setFormData({ ...formData, lap_record_holder: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-lap-record-year">Lap Record Year</Label>
              <Input
                id="edit-lap-record-year"
                type="number"
                value={formData.lap_record_year ?? ""}
                onChange={(e) => setFormData({ ...formData, lap_record_year: parseOptionalNumber(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Circuit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
