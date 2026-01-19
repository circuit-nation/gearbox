"use client";

import { useState } from "react";
import { useEvents, useCreateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useSports } from "@/hooks/use-sports";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreateEvent, EventType } from "@/lib/schema";
import { format } from "date-fns";

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
  "watch party",
];

export function EventsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateEvent>({
    id: "",
    title: "",
    round: 1,
    type: "race",
    location_str: "",
    sport: "",
    country_code: "",
    country: "",
    event_start_at: "",
    event_end_at: "",
    images: [],
  });

  const { data, isLoading } = useEvents();
  const { data: sportsData } = useSports();
  const createEvent = useCreateEvent({
    onSuccess: () => {
      toast.success("Event created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteEvent = useDeleteEvent({
    onSuccess: () => {
      toast.success("Event deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      round: 1,
      type: "race",
      location_str: "",
      sport: "",
      country_code: "",
      country: "",
      event_start_at: "",
      event_end_at: "",
      images: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}
                  >
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
                  <Select
                    value={formData.sport}
                    onValueChange={(value) => setFormData({ ...formData, sport: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportsData?.documents.map((sport) => (
                        <SelectItem key={sport.$id} value={sport.$id}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., Monaco"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country_code">Country Code</Label>
                  <Input
                    id="country_code"
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                    placeholder="e.g., MC"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location_str">Location</Label>
                <Input
                  id="location_str"
                  value={formData.location_str}
                  onChange={(e) => setFormData({ ...formData, location_str: e.target.value })}
                  placeholder="e.g., Circuit de Monaco"
                  required
                />
              </div>

              <div>
                <Label htmlFor="location_id">Location ID (Optional)</Label>
                <Input
                  id="location_id"
                  value={formData.location_id || ""}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                  placeholder="Optional: Appwrite location document ID if using separate location collection"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_start_at">Start Date & Time</Label>
                  <Input
                    id="event_start_at"
                    type="datetime-local"
                    value={formData.event_start_at}
                    onChange={(e) => setFormData({ ...formData, event_start_at: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="event_end_at">End Date & Time</Label>
                  <Input
                    id="event_end_at"
                    type="datetime-local"
                    value={formData.event_end_at}
                    onChange={(e) => setFormData({ ...formData, event_end_at: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>
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

              <Button type="submit" className="w-full" disabled={createEvent.isPending}>
                {createEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Event
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.documents.map((event) => {
                const sport = sportsData?.documents.find((s) => s.$id === event.sport);
                return (
                  <TableRow key={event.$id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <Badge>{event.round}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{event.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {event.location_str}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {event.country} ({event.country_code})
                      </span>
                    </TableCell>
                    <TableCell>{sport?.name || "Unknown"}</TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(event.event_start_at), "PPp")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEvent.mutate(event.$id)}
                        disabled={deleteEvent.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
