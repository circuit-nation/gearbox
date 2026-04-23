import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildQuery, fetchJson, ListResponse } from "@/lib/api-client";
import { Sport, CreateSport } from "@/lib/schema";

type MutationOptions<TResult> = {
  onSuccess?: (data: TResult) => void;
  onError?: (error: Error) => void;
};

export function useSports(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterType?: string
) {
  const query = useQuery({
    queryKey: ["sports", page, limit, sortBy, sortOrder, filterName, filterType],
    queryFn: () =>
      fetchJson<ListResponse<Sport>>(
        `/api/sports${buildQuery({
          page,
          limit,
          sortBy,
          sortOrder,
          filterName,
          filterType,
        })}`
      ),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useSport(id: string) {
  const query = useQuery({
    queryKey: ["sports", "detail", id],
    queryFn: () => fetchJson<Sport | null>(`/api/sports${buildQuery({ id })}`),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: Boolean(id) ? query.isLoading : false,
  };
}

export function useCreateSport(options?: MutationOptions<Sport | null>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateSport) =>
      fetchJson<Sport | null>("/api/sports", {
        method: "POST",
        body: data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateSport(options?: MutationOptions<Sport | null>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<Sport> }) =>
      fetchJson<Sport | null>("/api/sports", {
        method: "PUT",
        body: { id: payload.id, ...payload.data },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteSport(options?: MutationOptions<{ success: boolean; id: string }>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean; id: string }>(
        `/api/sports${buildQuery({ id })}`,
        { method: "DELETE" }
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}
