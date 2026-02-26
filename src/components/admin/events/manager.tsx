"use client";

import { useState, useMemo, useEffect } from "react";
import type { FormEvent } from "react";
import { useEvents, useCreateEvent, useDeleteEvent, useUpdateEvent } from "@/hooks/use-events";
import { useSports } from "@/hooks/use-sports";
import { useCircuitsByIds } from "@/hooks/use-circuits";
import { toast } from "sonner";
import { CreateEvent, Event, Circuit } from "@/lib/schema";
import { format } from "date-fns";
import { DataTable } from "../data-table";
import { ConfirmationDialog } from "../confirmation-dialog";
import { useDeleteDialogState, useTableState } from "../manager-state";
import { createEventsColumns } from "./columns";
import { EventsFilters } from "./filters";
import { EventsCreateDialog, EventsEditDialog } from "./dialogs";

export function EventsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteTargetId,
    requestDelete,
    clearDelete,
  } = useDeleteDialogState<string>();
  const { pagination, setPagination, sorting, setSorting, resetPage, sortBy, sortOrder } = useTableState([
    { id: "event_start_at", desc: false },
  ]);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCircuitId, setFilterCircuitId] = useState("");
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
      clearDelete();
    },
    onError: (error) => {
      toast.error(error.message);
      clearDelete();
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

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
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

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteEvent.mutate(deleteTargetId);
    }
  };

  const columns = useMemo(
    () =>
      createEventsColumns({
        sports: sportsData?.documents,
        circuitById,
        onEdit: handleEdit,
        onDelete: requestDelete,
        isDeleting: deleteEvent.isPending,
      }),
    [sportsData, circuitById, deleteEvent.isPending, requestDelete]
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
          onSubmit={handleSubmit}
          sports={sportsData?.documents}
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
        onSubmit={handleEditSubmit}
        sports={sportsData?.documents}
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
            filterCircuitId={filterCircuitId}
            onFilterTitleChange={(value) => {
              setFilterTitle(value);
              resetPage();
            }}
            onFilterTypeChange={(value) => {
              setFilterType(value);
              resetPage();
            }}
            onFilterCircuitIdChange={(value) => {
              setFilterCircuitId(value);
              resetPage();
            }}
          />
        }
      />
    </div>
  );
}
