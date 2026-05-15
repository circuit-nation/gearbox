"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import { useEvents, useCreateEvent, useDeleteEvent, useUpdateEvent } from "@/hooks/use-events";
import { useSports } from "@/hooks/use-sports";
import { useCircuits } from "@/hooks/use-circuits";
import { toast } from "sonner";
import { CreateEvent, Event, EventLinks } from "@/lib/circuit-nation/types";
import { format } from "date-fns";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmationDialog } from "@/components/shared/confirm-dialog";
import { useDeleteDialogState, useTableState } from "../manager-state";
import { createEventsColumns } from "./columns";
import { EventsFilters } from "./filters";
import { EventsCreateDialog, EventsEditDialog } from "./dialogs";

type EventLinksForm = Omit<EventLinks, "_id">;

function hasLinkValues(links: EventLinksForm) {
  return Boolean(
    links.instagram?.trim() ||
    links.youtube?.trim() ||
    links.discord?.trim() ||
    links.x?.trim() ||
    links.sources?.some((source) => source.trim())
  );
}

function buildLinksPayload(links: EventLinksForm): EventLinksForm | undefined {
  if (!hasLinkValues(links)) {
    return undefined;
  }

  return {
    instagram: links.instagram?.trim() || undefined,
    youtube: links.youtube?.trim() || undefined,
    discord: links.discord?.trim() || undefined,
    x: links.x?.trim() || undefined,
    sources: links.sources?.map((source) => source.trim()).filter(Boolean),
  };
}

function linksFromEvent(event?: Event | null): EventLinksForm {
  if (!event?.links) {
    return {};
  }

  return {
    instagram: event.links.instagram,
    youtube: event.links.youtube,
    discord: event.links.discord,
    x: event.links.x,
    sources: event.links.sources,
  };
}

export function EventsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { deleteConfirmOpen, setDeleteConfirmOpen, deleteTargetId, requestDelete, clearDelete } =
    useDeleteDialogState<string>();
  const { pagination, setPagination, sorting, setSorting, resetPage, sortBy, sortOrder } =
    useTableState([{ id: "event_start_at", desc: false }]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterType, setFilterType] = useState("");
  const [debouncedFilterTitle, setDebouncedFilterTitle] = useState("");
  const [debouncedFilterType, setDebouncedFilterType] = useState("");
  const [formData, setFormData] = useState<CreateEvent>({
    title: "",
    round: 1,
    type: "race",
    circuit_id: "",
    sport_id: "",
    event_start_at: "",
    event_end_at: "",
    images: [],
  });
  const [linksForm, setLinksForm] = useState<EventLinksForm>({});
  const [editFormData, setEditFormData] = useState<Partial<Event>>({});
  const [editLinksForm, setEditLinksForm] = useState<EventLinksForm>({});

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

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

  const { data, isLoading } = useEvents(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    debouncedFilterTitle || undefined,
    debouncedFilterType || undefined
  );
  const { data: sportsData } = useSports(1, 100);
  const { data: circuitsData } = useCircuits(1, 200);
  const createEvent = useCreateEvent({
    onSuccess: () => {
      toast.success("Event created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Unable to create event. Please try again.");
    },
  });

  const deleteEvent = useDeleteEvent({
    onSuccess: () => {
      toast.success("Event deleted successfully!");
      clearDelete();
    },
    onError: () => {
      toast.error("Unable to delete event. Please try again.");
      clearDelete();
    },
  });

  const updateEvent = useUpdateEvent({
    onSuccess: () => {
      toast.success("Event updated successfully!");
      setIsEditOpen(false);
      setEditingEvent(null);
      setEditFormData({});
      setEditLinksForm({});
      setEditStartDate("");
      setEditStartTime("");
      setEditEndDate("");
      setEditEndTime("");
    },
    onError: () => {
      toast.error("Unable to update event. Please try again.");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      round: 1,
      type: "race",
      circuit_id: "",
      sport_id: "",
      event_start_at: "",
      event_end_at: "",
      images: [],
    });
    setLinksForm({});
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
  };

  const formatDateValue = (value?: string) => (value ? format(new Date(value), "yyyy-MM-dd") : "");

  const formatTimeValue = (value?: string) => (value ? format(new Date(value), "HH:mm") : "");

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const eventStartAt = buildIsoDateTime(startDate, startTime);
    const eventEndAt = buildIsoDateTime(endDate, endTime);
    const links = buildLinksPayload(linksForm);
    const payload: CreateEvent = {
      ...formData,
      event_start_at: eventStartAt,
      event_end_at: eventEndAt,
      images: formData.images?.map((image) => image.trim()).filter(Boolean) || [],
      ...(links ? { links } : {}),
    };
    createEvent.mutate(payload);
  };

  const handleEdit = useCallback((event: Event) => {
    setEditingEvent(event);
    setEditFormData({
      title: event.title,
      round: event.round,
      type: event.type,
      circuit_id: event.circuit_id,
      sport_id: event.sport_id,
      images: event.images,
    });
    setEditLinksForm(linksFromEvent(event));
    setEditStartDate(formatDateValue(event.event_start_at));
    setEditStartTime(formatTimeValue(event.event_start_at));
    setEditEndDate(formatDateValue(event.event_end_at));
    setEditEndTime(formatTimeValue(event.event_end_at));
    setIsEditOpen(true);
  }, []);

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingEvent) {
      const eventStartAt =
        buildIsoDateTime(editStartDate, editStartTime) || editingEvent.event_start_at;
      const eventEndAt = buildIsoDateTime(editEndDate, editEndTime) || editingEvent.event_end_at;
      const links = buildLinksPayload(editLinksForm);
      updateEvent.mutate({
        id: editingEvent._id,
        data: {
          ...editFormData,
          event_start_at: eventStartAt,
          event_end_at: eventEndAt,
          images: editFormData.images?.map((image) => image.trim()).filter(Boolean),
          ...(links ? { links } : {}),
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteEvent.mutate(deleteTargetId);
    }
  };

  const columns = useMemo(
    () =>
      createEventsColumns({
        sports: sportsData?.documents,
        onEdit: handleEdit,
        onDelete: requestDelete,
        isDeleting: deleteEvent.isPending,
      }),
    [sportsData, deleteEvent.isPending, requestDelete, handleEdit]
  );

  const tableData = useMemo(() => data?.documents || [], [data]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <EventsCreateDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          formData={formData}
          setFormData={setFormData}
          linksForm={linksForm}
          setLinksForm={setLinksForm}
          onSubmit={handleSubmit}
          sports={sportsData?.documents}
          circuits={circuitsData?.documents}
          isSubmitting={createEvent.isPending}
          startDate={startDate}
          startTime={startTime}
          endDate={endDate}
          endTime={endTime}
          setStartDate={setStartDate}
          setStartTime={setStartTime}
          setEndDate={setEndDate}
          setEndTime={setEndTime}
          buildIsoDateTime={buildIsoDateTime}
        />
      </div>

      <EventsEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        formData={editFormData}
        setFormData={setEditFormData}
        linksForm={editLinksForm}
        setLinksForm={setEditLinksForm}
        onSubmit={handleEditSubmit}
        sports={sportsData?.documents}
        circuits={circuitsData?.documents}
        isSubmitting={updateEvent.isPending}
        startDate={editStartDate}
        startTime={editStartTime}
        endDate={editEndDate}
        endTime={editEndTime}
        setStartDate={setEditStartDate}
        setStartTime={setEditStartTime}
        setEndDate={setEditEndDate}
        setEndTime={setEditEndTime}
        buildIsoDateTime={buildIsoDateTime}
      />

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
        filterComponent={
          <EventsFilters
            filterTitle={filterTitle}
            filterType={filterType}
            onFilterTitleChange={(value) => {
              setFilterTitle(value);
              resetPage();
            }}
            onFilterTypeChange={(value) => {
              setFilterType(value);
              resetPage();
            }}
          />
        }
      />
    </div>
  );
}
