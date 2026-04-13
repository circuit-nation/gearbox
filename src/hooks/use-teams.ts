import { useMutation, useQuery } from "@tanstack/react-query";
import { buildQuery, fetchJson, ListResponse } from "@/lib/api-client";
import { Team, CreateTeam } from "@/lib/schema";

type MutationOptions<TResult> = {
  onSuccess?: (data: TResult) => void;
  onError?: (error: Error) => void;
};

export function useTeams(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterSport?: string
) {
  const query = useQuery({
    queryKey: ["teams", page, limit, sortBy, sortOrder, filterName, filterSport],
    queryFn: () =>
      fetchJson<ListResponse<Team>>(
        `/api/teams${buildQuery({
          page,
          limit,
          sortBy,
          sortOrder,
          filterName,
          filterSport,
        })}`
      ),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useTeam(id: string) {
  const query = useQuery({
    queryKey: ["teams", "detail", id],
    queryFn: () => fetchJson<Team | null>(`/api/teams${buildQuery({ id })}`),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: Boolean(id) ? query.isLoading : false,
  };
}

export function useCreateTeam(options?: MutationOptions<Team | null>) {
  const mutation = useMutation({
    mutationFn: (data: CreateTeam) =>
      fetchJson<Team | null>("/api/teams", {
        method: "POST",
        body: data,
      }),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateTeam(options?: MutationOptions<Team | null>) {
  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<Team> }) =>
      fetchJson<Team | null>("/api/teams", {
        method: "PUT",
        body: { id: payload.id, ...payload.data },
      }),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteTeam(options?: MutationOptions<{ success: boolean; id: string }>) {
  const mutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean; id: string }>(
        `/api/teams${buildQuery({ id })}`,
        { method: "DELETE" }
      ),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}
