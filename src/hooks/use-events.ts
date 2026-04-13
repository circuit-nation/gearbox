import { useMutation, useQuery } from "@tanstack/react-query";
import { buildQuery, fetchJson, ListResponse } from "@/lib/api-client";
import { Event, CreateEvent } from "@/lib/schema";

type MutationOptions<TResult> = {
  onSuccess?: (data: TResult) => void;
  onError?: (error: Error) => void;
};

export function useEvents(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterTitle?: string,
  filterType?: string,
  filterCircuitId?: string
) {
  const query = useQuery({
    queryKey: [
      "events",
      page,
      limit,
      sortBy,
      sortOrder,
      filterTitle,
      filterType,
      filterCircuitId,
    ],
    queryFn: () =>
      fetchJson<ListResponse<Event>>(
        `/api/events${buildQuery({
          page,
          limit,
          sortBy,
          sortOrder,
          filterTitle,
          filterType,
          filterCircuitId,
        })}`
      ),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useEvent(id: string) {
  const query = useQuery({
    queryKey: ["events", "detail", id],
    queryFn: () => fetchJson<Event | null>(`/api/events${buildQuery({ id })}`),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: Boolean(id) ? query.isLoading : false,
  };
}

export function useCreateEvent(options?: MutationOptions<Event | null>) {
  const mutation = useMutation({
    mutationFn: (data: CreateEvent) =>
      fetchJson<Event | null>("/api/events", {
        method: "POST",
        body: data,
      }),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateEvent(options?: MutationOptions<Event | null>) {
  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<Event> }) =>
      fetchJson<Event | null>("/api/events", {
        method: "PUT",
        body: { id: payload.id, ...payload.data },
      }),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteEvent(options?: MutationOptions<{ success: boolean; id: string }>) {
  const mutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean; id: string }>(
        `/api/events${buildQuery({ id })}`,
        { method: "DELETE" }
      ),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}
