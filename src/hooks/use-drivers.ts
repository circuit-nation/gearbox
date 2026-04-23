import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildQuery, fetchJson, ListResponse } from "@/lib/api-client";
import { Driver, CreateDriver } from "@/lib/schema";

type MutationOptions<TResult> = {
  onSuccess?: (data: TResult) => void;
  onError?: (error: Error) => void;
};

export function useDrivers(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterSport?: string,
  filterTeam?: string
) {
  const query = useQuery({
    queryKey: ["drivers", page, limit, sortBy, sortOrder, filterName, filterSport, filterTeam],
    queryFn: () =>
      fetchJson<ListResponse<Driver>>(
        `/api/drivers${buildQuery({
          page,
          limit,
          sortBy,
          sortOrder,
          filterName,
          filterSport,
          filterTeam,
        })}`
      ),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useDriver(id: string) {
  const query = useQuery({
    queryKey: ["drivers", "detail", id],
    queryFn: () => fetchJson<Driver | null>(`/api/drivers${buildQuery({ id })}`),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: Boolean(id) ? query.isLoading : false,
  };
}

export function useCreateDriver(options?: MutationOptions<Driver | null>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateDriver) =>
      fetchJson<Driver | null>("/api/drivers", {
        method: "POST",
        body: data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateDriver(options?: MutationOptions<Driver | null>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<Driver> }) =>
      fetchJson<Driver | null>("/api/drivers", {
        method: "PUT",
        body: { id: payload.id, ...payload.data },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteDriver(options?: MutationOptions<{ success: boolean; id: string }>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean; id: string }>(
        `/api/drivers${buildQuery({ id })}`,
        { method: "DELETE" }
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}
