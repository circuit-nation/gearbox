import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { Loader2, Plus } from "lucide-react";
import { CreateEvent, Event, EventType } from "@/lib/schema";

const EVENT_TYPES: EventType[] = [
  "race",
  "qualifying",
  "practice",
  "sprint",
  "test",
  "shootout",
  "warmup",
  "demo",
  "news",
  "announcement",
  "update",
  "watch-party",
];

type SportOption = {
  convexId: string;
  name: string;
};

type EventsCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateEvent;
  setFormData: Dispatch<SetStateAction<CreateEvent>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  setStartTime: Dispatch<SetStateAction<string>>;
  setEndDate: Dispatch<SetStateAction<string>>;
  setEndTime: Dispatch<SetStateAction<string>>;
  buildIsoDateTime: (date: string, time: string) => string;
};

type EventsEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Event>;
  setFormData: Dispatch<SetStateAction<Partial<Event>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  setStartTime: Dispatch<SetStateAction<string>>;
  setEndDate: Dispatch<SetStateAction<string>>;
  setEndTime: Dispatch<SetStateAction<string>>;
  buildIsoDateTime: (date: string, time: string) => string;
};

export function EventsCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
  startDate,
  startTime,
  endDate,
  endTime,
  setStartDate,
  setStartTime,
  setEndDate,
  setEndTime,
  buildIsoDateTime,
}: EventsCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id">ID</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., monaco-gp-2024"
                required
              />
            </div>
            <div>
              <Label htmlFor="round">Round</Label>
              <Input
                id="round"
                type="number"
                value={formData.round}
                onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Monaco Grand Prix"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sport">Sport</Label>
              <Select value={formData.sport_id} onValueChange={(value) => setFormData({ ...formData, sport_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports?.map((sport) => (
                    <SelectItem key={sport.convexId} value={sport.convexId}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="circuit_id">Circuit ID</Label>
              <Input
                id="circuit_id"
                value={formData.circuit_id}
                onChange={(e) => setFormData({ ...formData, circuit_id: e.target.value })}
                placeholder="Convex circuit document ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="links_id">Links ID (Optional)</Label>
              <Input
                id="links_id"
                value={formData.links_id || ""}
                onChange={(e) => setFormData({ ...formData, links_id: e.target.value })}
                placeholder="Optional event_links document ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              id="event_start_date"
              label="Start Date"
              value={startDate}
              onChange={(value) => {
                setStartDate(value);
                const nextIso = buildIsoDateTime(value, startTime);
                setFormData((prev) => ({ ...prev, event_start_at: nextIso }));
              }}
              required
            />
            <TimePicker
              id="event_start_time"
              label="Start Time"
              value={startTime}
              onChange={(value) => {
                setStartTime(value);
                const nextIso = buildIsoDateTime(startDate, value);
                setFormData((prev) => ({ ...prev, event_start_at: nextIso }));
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              id="event_end_date"
              label="End Date"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                const nextIso = buildIsoDateTime(value, endTime);
                setFormData((prev) => ({ ...prev, event_end_at: nextIso }));
              }}
              required
            />
            <TimePicker
              id="event_end_time"
              label="End Time"
              value={endTime}
              onChange={(value) => {
                setEndTime(value);
                const nextIso = buildIsoDateTime(endDate, value);
                setFormData((prev) => ({ ...prev, event_end_at: nextIso }));
              }}
              required
            />
          </div>

          <div>
            <Label htmlFor="images">Image URLs (comma-separated)</Label>
            <Input
              id="images"
              value={formData.images?.join(", ") || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  images: e.target.value.split(",").map((url) => url.trim()).filter(Boolean),
                })
              }
              placeholder="https://image1.jpg, https://image2.jpg"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Event
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EventsEditDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
  startDate,
  startTime,
  endDate,
  endTime,
  setStartDate,
  setStartTime,
  setEndDate,
  setEndTime,
  buildIsoDateTime,
}: EventsEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-round">Round</Label>
              <Input
                id="edit-round"
                type="number"
                value={formData.round || 1}
                onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Monaco Grand Prix"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-sport">Sport</Label>
              <Select value={formData.sport_id} onValueChange={(value) => setFormData({ ...formData, sport_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports?.map((sport) => (
                    <SelectItem key={sport.convexId} value={sport.convexId}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-circuit_id">Circuit ID</Label>
              <Input
                id="edit-circuit_id"
                value={formData.circuit_id || ""}
                onChange={(e) => setFormData({ ...formData, circuit_id: e.target.value })}
                placeholder="Convex circuit document ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-links_id">Links ID (Optional)</Label>
              <Input
                id="edit-links_id"
                value={formData.links_id || ""}
                onChange={(e) => setFormData({ ...formData, links_id: e.target.value })}
                placeholder="Optional event_links document ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              id="edit-event_start_date"
              label="Start Date"
              value={startDate}
              onChange={(value) => {
                setStartDate(value);
                const nextIso = buildIsoDateTime(value, startTime);
                setFormData((prev) => ({ ...prev, event_start_at: nextIso }));
              }}
              required
            />
            <TimePicker
              id="edit-event_start_time"
              label="Start Time"
              value={startTime}
              onChange={(value) => {
                setStartTime(value);
                const nextIso = buildIsoDateTime(startDate, value);
                setFormData((prev) => ({ ...prev, event_start_at: nextIso }));
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              id="edit-event_end_date"
              label="End Date"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                const nextIso = buildIsoDateTime(value, endTime);
                setFormData((prev) => ({ ...prev, event_end_at: nextIso }));
              }}
              required
            />
            <TimePicker
              id="edit-event_end_time"
              label="End Time"
              value={endTime}
              onChange={(value) => {
                setEndTime(value);
                const nextIso = buildIsoDateTime(endDate, value);
                setFormData((prev) => ({ ...prev, event_end_at: nextIso }));
              }}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-images">Image URLs (comma-separated)</Label>
            <Input
              id="edit-images"
              value={formData.images?.join(", ") || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  images: e.target.value.split(",").map((url) => url.trim()).filter(Boolean),
                })
              }
              placeholder="https://image1.jpg, https://image2.jpg"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Event
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
