import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { Event, CreateEvent } from "@/lib/schema";

interface ListResponse<T> {
  total: number;
  documents: T[];
}

// API Fetcher Functions
async function fetchEvents(): Promise<ListResponse<Event>> {
  const response = await fetch("/api/events");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch events");
  }

  return response.json();
}

async function fetchEvent(id: string): Promise<Event> {
  const response = await fetch(`/api/events?id=${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch event");
  }

  return response.json();
}

async function createEvent(data: CreateEvent): Promise<Event> {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create event");
  }

  return response.json();
}

async function updateEvent(id: string, data: Partial<Event>): Promise<Event> {
  const response = await fetch("/api/events", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update event");
  }

  return response.json();
}

async function deleteEvent(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/events?id=${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete event");
  }

  return response.json();
}

// Query Hooks
export function useEvents(options?: Omit<UseQueryOptions<ListResponse<Event>>, "queryKey" | "queryFn">) {
  return useQuery<ListResponse<Event>>({
    queryKey: ["events"],
    queryFn: fetchEvents,
    ...options,
  });
}

export function useEvent(id: string, options?: Omit<UseQueryOptions<Event>, "queryKey" | "queryFn">) {
  return useQuery<Event>({
    queryKey: ["events", id],
    queryFn: () => fetchEvent(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateEvent(options?: UseMutationOptions<Event, Error, CreateEvent>) {
  const queryClient = useQueryClient();
  return useMutation<Event, Error, CreateEvent>({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    ...options,
  });
}

export function useUpdateEvent(options?: UseMutationOptions<Event, Error, { id: string; data: Partial<Event> }>) {
  const queryClient = useQueryClient();
  return useMutation<Event, Error, { id: string; data: Partial<Event> }>({
    mutationFn: ({ id, data }) => updateEvent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", variables.id] });
    },
    ...options,
  });
}

export function useDeleteEvent(options?: UseMutationOptions<{ success: boolean }, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    ...options,
  });
}
