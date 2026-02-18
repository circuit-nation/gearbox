"use client";

import { useState, useMemo, useEffect } from "react";
import { useEvents, useCreateEvent, useDeleteEvent, useUpdateEvent } from "@/hooks/use-events";
import { useSports } from "@/hooks/use-sports";
import { useCircuitsByIds } from "@/hooks/use-circuits";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreateEvent, EventType, Event, Circuit } from "@/lib/schema";
import { format } from "date-fns";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable, createSortableHeader } from "./data-table";
import { ConfirmationDialog } from "./confirmation-dialog";

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

export function EventsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: "event_start_at", desc: false }]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCircuitId, setFilterCircuitId] = useState("");
  
  // Debounced filter states
  const [debouncedFilterTitle, setDebouncedFilterTitle] = useState("");
  const [debouncedFilterType, setDebouncedFilterType] = useState("");
  const [debouncedFilterCircuitId, setDebouncedFilterCircuitId] = useState("");
  
  const [formData, setFormData] = useState<CreateEvent>({
    id: "",
    title: "",
    round: 1,
    type: "race",
    circuit_id: "",
    sport_id: "",
    event_start_at: "",
    event_end_at: "",
    images: [],
  });
  const [editFormData, setEditFormData] = useState<Partial<Event>>({});

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // Debounce filter values (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterTitle(filterTitle);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterTitle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterType(filterType);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterCircuitId(filterCircuitId);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterCircuitId]);

  // Extract sorting values for API
  const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

  const { data, isLoading } = useEvents(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    debouncedFilterTitle || undefined,
    debouncedFilterType || undefined,
    debouncedFilterCircuitId || undefined
  );
  const { data: sportsData } = useSports(1, 100);
  const circuitIds = useMemo(
    () => Array.from(new Set((data?.documents || []).map((event) => event.circuit_id).filter(Boolean))),
    [data]
  );
  const { data: circuitsData } = useCircuitsByIds(circuitIds);
  const circuitById = useMemo(() => {
    const map = new Map<string, Circuit>();
    (circuitsData || []).forEach((circuit) => {
      map.set(circuit.convexId, circuit);
    });
    return map;
  }, [circuitsData]);
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
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    },
  });

  const updateEvent = useUpdateEvent({
    onSuccess: () => {
      toast.success("Event updated successfully!");
      setIsEditOpen(false);
      setEditingEvent(null);
      setEditFormData({});
      setEditStartDate("");
      setEditStartTime("");
      setEditEndDate("");
      setEditEndTime("");
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
      circuit_id: "",
      sport_id: "",
      event_start_at: "",
      event_end_at: "",
      images: [],
    });
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
  };

  const formatDateValue = (value?: string) =>
    value ? format(new Date(value), "yyyy-MM-dd") : "";

  const formatTimeValue = (value?: string) =>
    value ? format(new Date(value), "HH:mm") : "";

  const buildIsoDateTime = (date: string, time: string) => {
    if (!date || !time) {
      return "";
    }
    const [hours, minutes] = time.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return "";
    }
    const localDate = new Date(date);
    localDate.setHours(hours, minutes, 0, 0);
    return localDate.toISOString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventStartAt = buildIsoDateTime(startDate, startTime);
    const eventEndAt = buildIsoDateTime(endDate, endTime);
    const payload: CreateEvent = {
      ...formData,
      event_start_at: eventStartAt,
      event_end_at: eventEndAt,
      links_id: formData.links_id?.trim() ? formData.links_id : undefined,
    };
    createEvent.mutate(payload);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setEditFormData({
      title: event.title,
      round: event.round,
      type: event.type,
      circuit_id: event.circuit_id,
      links_id: event.links_id,
      sport_id: event.sport_id,
      images: event.images,
    });
    setEditStartDate(formatDateValue(event.event_start_at));
    setEditStartTime(formatTimeValue(event.event_start_at));
    setEditEndDate(formatDateValue(event.event_end_at));
    setEditEndTime(formatTimeValue(event.event_end_at));
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      const eventStartAt = buildIsoDateTime(editStartDate, editStartTime) || editingEvent.event_start_at;
      const eventEndAt = buildIsoDateTime(editEndDate, editEndTime) || editingEvent.event_end_at;
      updateEvent.mutate({
        id: editingEvent.convexId,
        data: {
          ...editFormData,
          event_start_at: eventStartAt,
          event_end_at: eventEndAt,
          links_id: editFormData.links_id?.trim() ? editFormData.links_id : undefined,
        },
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setEventToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      deleteEvent.mutate(eventToDelete);
    }
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Event>[]>(
    () => [
      {
        accessorKey: "title",
        header: createSortableHeader("Title"),
        cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
      },
      {
        accessorKey: "round",
        header: createSortableHeader("Round"),
        cell: ({ row }) => <Badge>{row.original.round}</Badge>,
      },
      {
        accessorKey: "type",
        header: createSortableHeader("Type"),
        cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
      },
      {
        accessorKey: "circuit_id",
        header: createSortableHeader("Country"),
        cell: ({ row }) => {
          const circuit = circuitById.get(row.original.circuit_id);
          return <div className="text-xs">{circuit?.country || "Unknown"}</div>;
        },
      },
      {
        accessorKey: "sport_id",
        header: createSortableHeader("Sport"),
        cell: ({ row }) => {
          const sport = sportsData?.documents.find((s) => s.convexId === row.original.sport_id);
          return sport?.name || "Unknown";
        },
      },
      {
        accessorKey: "event_start_at",
        header: createSortableHeader("Start Date"),
        cell: ({ row }) => (
          <div className="text-xs">
            {format(new Date(row.original.event_start_at), "PPp")}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(row.original.convexId)}
              disabled={deleteEvent.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [sportsData, deleteEvent.isPending, circuitById]
  );

  const tableData = useMemo(() => data?.documents || [], [data]);

  const filterComponent = (
    <div className="flex items-center gap-4">
      <Input
        placeholder="Filter by title..."
        value={filterTitle}
        onChange={(event) => {
          setFilterTitle(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by type..."
        value={filterType}
        onChange={(event) => {
          setFilterType(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by circuit ID..."
        value={filterCircuitId}
        onChange={(event) => {
          setFilterCircuitId(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
    </div>
  );

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
                    value={formData.sport_id}
                    onValueChange={(value) => setFormData({ ...formData, sport_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportsData?.documents.map((sport) => (
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

              <Button type="submit" className="w-full" disabled={createEvent.isPending}>
                {createEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Event
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-round">Round</Label>
                <Input
                  id="edit-round"
                  type="number"
                  value={editFormData.round || 1}
                  onChange={(e) => setEditFormData({ ...editFormData, round: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title || ""}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="e.g., Monaco Grand Prix"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editFormData.type}
                  onValueChange={(value) => setEditFormData({ ...editFormData, type: value as EventType })}
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
                <Label htmlFor="edit-sport">Sport</Label>
                <Select
                  value={editFormData.sport_id}
                  onValueChange={(value) => setEditFormData({ ...editFormData, sport_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sportsData?.documents.map((sport) => (
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
                  value={editFormData.circuit_id || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, circuit_id: e.target.value })}
                  placeholder="Convex circuit document ID"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-links_id">Links ID (Optional)</Label>
                <Input
                  id="edit-links_id"
                  value={editFormData.links_id || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, links_id: e.target.value })}
                  placeholder="Optional event_links document ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                id="edit-event_start_date"
                label="Start Date"
                value={editStartDate}
                onChange={(value) => {
                  setEditStartDate(value);
                  const nextIso = buildIsoDateTime(value, editStartTime);
                  setEditFormData((prev) => ({ ...prev, event_start_at: nextIso }));
                }}
                required
              />
              <TimePicker
                id="edit-event_start_time"
                label="Start Time"
                value={editStartTime}
                onChange={(value) => {
                  setEditStartTime(value);
                  const nextIso = buildIsoDateTime(editStartDate, value);
                  setEditFormData((prev) => ({ ...prev, event_start_at: nextIso }));
                }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                id="edit-event_end_date"
                label="End Date"
                value={editEndDate}
                onChange={(value) => {
                  setEditEndDate(value);
                  const nextIso = buildIsoDateTime(value, editEndTime);
                  setEditFormData((prev) => ({ ...prev, event_end_at: nextIso }));
                }}
                required
              />
              <TimePicker
                id="edit-event_end_time"
                label="End Time"
                value={editEndTime}
                onChange={(value) => {
                  setEditEndTime(value);
                  const nextIso = buildIsoDateTime(editEndDate, value);
                  setEditFormData((prev) => ({ ...prev, event_end_at: nextIso }));
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-images">Image URLs (comma-separated)</Label>
              <Input
                id="edit-images"
                value={editFormData.images?.join(", ") || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    images: e.target.value.split(",").map((url) => url.trim()).filter(Boolean),
                  })
                }
                placeholder="https://image1.jpg, https://image2.jpg"
              />
            </div>

            <Button type="submit" className="w-full" disabled={updateEvent.isPending}>
              {updateEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Event
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteEvent.isPending}
      />

      <DataTable
        data={tableData}
        columns={columns}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalCount={data?.total || 0}
        isLoading={isLoading}
        filterComponent={filterComponent}
      />
    </div>
  );
}
