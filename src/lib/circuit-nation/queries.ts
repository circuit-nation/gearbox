import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cnApi } from "@/lib/circuit-nation/api";
import type {
  Circuit,
  CreateCircuit,
  CreateDriver,
  CreateDriverLeaderboard,
  CreateEvent,
  UpdateEvent,
  CreateSport,
  CreateTeam,
  CreateTeamLeaderboard,
  Driver,
  DriverLeaderboardEntry,
  Event,
  Sport,
  Team,
  TeamLeaderboardEntry,
} from "@/lib/circuit-nation/types";

type MutationOptions<TResult, TVariables = unknown> = {
  onSuccess?: (data: TResult, variables: TVariables) => void;
  onError?: (error: Error) => void;
};

const currentYear = new Date().getFullYear();

export const cnKeys = {
  all: ["circuit-nation"] as const,
  events: {
    all: () => [...cnKeys.all, "events"] as const,
    list: (filters: object) => [...cnKeys.events.all(), "list", filters] as const,
    detail: (id: string) => [...cnKeys.events.all(), "detail", id] as const,
  },
  drivers: {
    all: () => [...cnKeys.all, "drivers"] as const,
    list: (filters: object) => [...cnKeys.drivers.all(), "list", filters] as const,
    detail: (id: string) => [...cnKeys.drivers.all(), "detail", id] as const,
  },
  sports: {
    all: () => [...cnKeys.all, "sports"] as const,
    list: (filters: object) => [...cnKeys.sports.all(), "list", filters] as const,
    detail: (id: string) => [...cnKeys.sports.all(), "detail", id] as const,
  },
  teams: {
    all: () => [...cnKeys.all, "teams"] as const,
    list: (filters: object) => [...cnKeys.teams.all(), "list", filters] as const,
    detail: (id: string) => [...cnKeys.teams.all(), "detail", id] as const,
  },
  circuits: {
    all: () => [...cnKeys.all, "circuits"] as const,
    list: (filters: object) => [...cnKeys.circuits.all(), "list", filters] as const,
    detail: (id: string) => [...cnKeys.circuits.all(), "detail", id] as const,
  },
  leaderboard: {
    all: () => [...cnKeys.all, "leaderboard"] as const,
    drivers: (filters: object) => [...cnKeys.leaderboard.all(), "drivers", filters] as const,
    driverDetail: (id: string) => [...cnKeys.leaderboard.all(), "drivers", "detail", id] as const,
    teams: (filters: object) => [...cnKeys.leaderboard.all(), "teams", filters] as const,
    teamDetail: (id: string) => [...cnKeys.leaderboard.all(), "teams", "detail", id] as const,
  },
};

export type { DriverLeaderboardEntry, TeamLeaderboardEntry };
export type PointsUpdateMode = "add" | "set";

export function useEvents(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterTitle?: string,
  filterType?: string
) {
  const filters = { page, limit, sortBy, sortOrder, filterTitle, filterType };
  const query = useQuery({
    queryKey: cnKeys.events.list(filters),
    queryFn: () => cnApi.events.list(filters),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useEvent(id: string) {
  const query = useQuery({
    queryKey: cnKeys.events.detail(id),
    queryFn: () => cnApi.events.get(id),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: Boolean(id) ? query.isLoading : false,
  };
}

export function useCreateEvent(options?: MutationOptions<Event | null, CreateEvent>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateEvent) => cnApi.events.create(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.events.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateEvent(
  options?: MutationOptions<Event | null, { id: string; data: UpdateEvent }>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: UpdateEvent }) =>
      cnApi.events.update(payload.id, payload.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.events.all() });
      queryClient.invalidateQueries({ queryKey: cnKeys.events.detail(variables.id) });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteEvent(
  options?: MutationOptions<{ success: boolean; id: string }, string>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => cnApi.events.delete(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.events.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDrivers(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterSport?: string,
  filterTeam?: string
) {
  const filters = { page, limit, sortBy, sortOrder, filterName, filterSport, filterTeam };
  const query = useQuery({
    queryKey: cnKeys.drivers.list(filters),
    queryFn: () => cnApi.drivers.list(filters),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useDriver(id: string) {
  const query = useQuery({
    queryKey: cnKeys.drivers.detail(id),
    queryFn: () => cnApi.drivers.get(id),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: Boolean(id) ? query.isLoading : false,
  };
}

export function useCreateDriver(options?: MutationOptions<Driver | null, CreateDriver>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateDriver) => cnApi.drivers.create(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.drivers.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateDriver(
  options?: MutationOptions<Driver | null, { id: string; data: Partial<Driver> }>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<Driver> }) =>
      cnApi.drivers.update(payload.id, payload.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.drivers.all() });
      queryClient.invalidateQueries({ queryKey: cnKeys.drivers.detail(variables.id) });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteDriver(
  options?: MutationOptions<{ success: boolean; id: string }, string>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => cnApi.drivers.delete(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.drivers.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useSports(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterType?: string
) {
  const filters = { page, limit, sortBy, sortOrder, filterName, filterType };
  const query = useQuery({
    queryKey: cnKeys.sports.list(filters),
    queryFn: () => cnApi.sports.list(filters),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useSport(id: string) {
  const query = useQuery({
    queryKey: cnKeys.sports.detail(id),
    queryFn: () => cnApi.sports.get(id),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: Boolean(id) ? query.isLoading : false,
  };
}

export function useCreateSport(options?: MutationOptions<Sport | null, CreateSport>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateSport) => cnApi.sports.create(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.sports.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateSport(
  options?: MutationOptions<Sport | null, { id: string; data: Partial<Sport> }>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<Sport> }) =>
      cnApi.sports.update(payload.id, payload.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.sports.all() });
      queryClient.invalidateQueries({ queryKey: cnKeys.sports.detail(variables.id) });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteSport(
  options?: MutationOptions<{ success: boolean; id: string }, string>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => cnApi.sports.delete(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.sports.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useTeams(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterSport?: string
) {
  const filters = { page, limit, sortBy, sortOrder, filterName, filterSport };
  const query = useQuery({
    queryKey: cnKeys.teams.list(filters),
    queryFn: () => cnApi.teams.list(filters),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useTeam(id: string) {
  const query = useQuery({
    queryKey: cnKeys.teams.detail(id),
    queryFn: () => cnApi.teams.get(id),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: Boolean(id) ? query.isLoading : false,
  };
}

export function useCreateTeam(options?: MutationOptions<Team | null, CreateTeam>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateTeam) => cnApi.teams.create(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.teams.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateTeam(
  options?: MutationOptions<Team | null, { id: string; data: Partial<Team> }>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<Team> }) =>
      cnApi.teams.update(payload.id, payload.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.teams.all() });
      queryClient.invalidateQueries({ queryKey: cnKeys.teams.detail(variables.id) });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteTeam(options?: MutationOptions<{ success: boolean; id: string }, string>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => cnApi.teams.delete(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.teams.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useCircuits(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterSport?: string,
  filterCountry?: string
) {
  const filters = { page, limit, sortBy, sortOrder, filterName, filterSport, filterCountry };
  const query = useQuery({
    queryKey: cnKeys.circuits.list(filters),
    queryFn: () => cnApi.circuits.list(filters),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useCircuit(id: string) {
  const query = useQuery({
    queryKey: cnKeys.circuits.detail(id),
    queryFn: () => cnApi.circuits.get(id),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: Boolean(id) ? query.isLoading : false,
  };
}

export function useCreateCircuit(options?: MutationOptions<Circuit | null, CreateCircuit>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateCircuit) => cnApi.circuits.create(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.circuits.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateCircuit(
  options?: MutationOptions<Circuit | null, { id: string; data: Partial<Circuit> }>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<Circuit> }) =>
      cnApi.circuits.update(payload.id, payload.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.circuits.all() });
      queryClient.invalidateQueries({ queryKey: cnKeys.circuits.detail(variables.id) });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteCircuit(
  options?: MutationOptions<{ success: boolean; id: string }, string>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => cnApi.circuits.delete(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.circuits.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDriverLeaderboard(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterYear: number = currentYear,
  filterName?: string,
  filterSport?: string,
  filterTeam?: string
) {
  const filters = {
    page,
    limit,
    sortBy,
    sortOrder,
    filterYear,
    filterName,
    filterSport,
    filterTeam,
  };
  const query = useQuery({
    queryKey: cnKeys.leaderboard.drivers(filters),
    queryFn: () => cnApi.leaderboard.drivers(filters),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useTeamLeaderboard(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterYear: number = currentYear,
  filterSport?: string,
  filterTeam?: string
) {
  const filters = { page, limit, sortBy, sortOrder, filterYear, filterSport, filterTeam };
  const query = useQuery({
    queryKey: cnKeys.leaderboard.teams(filters),
    queryFn: () => cnApi.leaderboard.teams(filters),
  });

  return { data: query.data, isLoading: query.isLoading };
}

export function useCreateDriverLeaderboard(
  options?: MutationOptions<DriverLeaderboardEntry | null, CreateDriverLeaderboard>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateDriverLeaderboard) => cnApi.leaderboard.createDriver(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.leaderboard.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateDriverLeaderboard(
  options?: MutationOptions<
    DriverLeaderboardEntry | null,
    { id: string; data: Partial<CreateDriverLeaderboard> }
  >
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<CreateDriverLeaderboard> }) =>
      cnApi.leaderboard.updateDriver(payload.id, payload.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.leaderboard.all() });
      queryClient.invalidateQueries({ queryKey: cnKeys.leaderboard.driverDetail(variables.id) });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteDriverLeaderboard(
  options?: MutationOptions<{ success: boolean; id: string }, string>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => cnApi.leaderboard.deleteDriver(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.leaderboard.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useCreateTeamLeaderboard(
  options?: MutationOptions<TeamLeaderboardEntry | null, CreateTeamLeaderboard>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateTeamLeaderboard) => cnApi.leaderboard.createTeam(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.leaderboard.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateTeamLeaderboard(
  options?: MutationOptions<
    TeamLeaderboardEntry | null,
    { id: string; data: Partial<CreateTeamLeaderboard> }
  >
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<CreateTeamLeaderboard> }) =>
      cnApi.leaderboard.updateTeam(payload.id, payload.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.leaderboard.all() });
      queryClient.invalidateQueries({ queryKey: cnKeys.leaderboard.teamDetail(variables.id) });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteTeamLeaderboard(
  options?: MutationOptions<{ success: boolean; id: string }, string>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => cnApi.leaderboard.deleteTeam(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.leaderboard.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateDriverPoints(
  options?: MutationOptions<
    DriverLeaderboardEntry | null,
    { id: string; mode: PointsUpdateMode; value: number }
  >
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { id: string; mode: PointsUpdateMode; value: number }) =>
      cnApi.leaderboard.updatePoints(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cnKeys.leaderboard.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}
