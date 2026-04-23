import { useMutation, useQuery } from "@tanstack/react-query";
import { buildQuery, fetchJson, ListResponse } from "@/lib/api-client";
import { Driver, TeamLeaderboardEntry } from "@/lib/schema";

type MutationOptions<TResult> = {
  onSuccess?: (data: TResult) => void;
  onError?: (error: Error) => void;
};

export type DriverLeaderboardEntry = Driver & {
  rank: number;
};

export type PointsUpdateMode = "add" | "set";

export function useDriverLeaderboard(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterSport?: string,
  filterTeam?: string
) {
  const query = useQuery({
    queryKey: [
      "leaderboard",
      "drivers",
      page,
      limit,
      sortBy,
      sortOrder,
      filterName,
      filterSport,
      filterTeam,
    ],
    queryFn: () =>
      fetchJson<ListResponse<DriverLeaderboardEntry>>(
        `/api/leaderboard/drivers${buildQuery({
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

export function useTeamLeaderboard(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterSport?: string,
  filterTeam?: string
) {
  const query = useQuery({
    queryKey: ["leaderboard", "teams", page, limit, sortBy, sortOrder, filterSport, filterTeam],
    queryFn: () =>
      fetchJson<ListResponse<TeamLeaderboardEntry>>(
        `/api/leaderboard/teams${buildQuery({
          page,
          limit,
          sortBy,
          sortOrder,
          filterSport,
          filterTeam,
        })}`
      ),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useUpdateDriverPoints(options?: MutationOptions<Driver | null>) {
  const mutation = useMutation({
    mutationFn: (payload: { id: string; mode: PointsUpdateMode; value: number }) =>
      fetchJson<Driver | null>("/api/leaderboard/points", {
        method: "PUT",
        body: payload,
      }),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}
