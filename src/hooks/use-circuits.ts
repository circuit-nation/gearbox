import { useMutation, useQuery } from "@tanstack/react-query";
import { buildQuery, fetchJson, ListResponse } from "@/lib/api-client";
import { Circuit, CreateCircuit } from "@/lib/schema";

type MutationOptions<TResult> = {
  onSuccess?: (data: TResult) => void;
  onError?: (error: Error) => void;
};

export function useCircuits(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterCountry?: string,
  filterSport?: string
) {
  const query = useQuery({
    queryKey: [
      "circuits",
      page,
      limit,
      sortBy,
      sortOrder,
      filterName,
      filterCountry,
      filterSport,
    ],
    queryFn: () =>
      fetchJson<ListResponse<Circuit>>(
        `/api/circuits${buildQuery({
          page,
          limit,
          sortBy,
          sortOrder,
          filterName,
          filterCountry,
          filterSport,
        })}`
      ),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useCircuit(id: string) {
  const query = useQuery({
    queryKey: ["circuits", "detail", id],
    queryFn: () => fetchJson<Circuit | null>(`/api/circuits${buildQuery({ id })}`),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: Boolean(id) ? query.isLoading : false,
  };
}

export function useCreateCircuit(options?: MutationOptions<Circuit | null>) {
  const mutation = useMutation({
    mutationFn: (data: CreateCircuit) =>
      fetchJson<Circuit | null>("/api/circuits", {
        method: "POST",
        body: data,
      }),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateCircuit(options?: MutationOptions<Circuit | null>) {
  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<Circuit> }) =>
      fetchJson<Circuit | null>("/api/circuits", {
        method: "PUT",
        body: { id: payload.id, ...payload.data },
      }),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteCircuit(options?: MutationOptions<{ success: boolean; id: string }>) {
  const mutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean; id: string }>(
        `/api/circuits${buildQuery({ id })}`,
        { method: "DELETE" }
      ),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useCircuitsByIds(ids: string[]) {
  const query = useQuery({
    queryKey: ["circuits", "byIds", ids],
    queryFn: () =>
      fetchJson<Circuit[]>(
        `/api/circuits${buildQuery({ ids: ids.join(",") })}`
      ),
    enabled: ids.length > 0,
  });

  return {
    data: query.data,
    isLoading: ids.length ? query.isLoading : false,
  };
}
