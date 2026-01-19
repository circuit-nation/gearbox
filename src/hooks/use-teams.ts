import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { Team, CreateTeam } from "@/lib/schema";

interface ListResponse<T> {
  total: number;
  documents: T[];
}

// API Fetcher Functions
async function fetchTeams(): Promise<ListResponse<Team>> {
  const response = await fetch("/api/teams");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch teams");
  }

  return response.json();
}

async function fetchTeam(id: string): Promise<Team> {
  const response = await fetch(`/api/teams?id=${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch team");
  }

  return response.json();
}

async function createTeam(data: CreateTeam): Promise<Team> {
  const response = await fetch("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create team");
  }

  return response.json();
}

async function updateTeam(id: string, data: Partial<Team>): Promise<Team> {
  const response = await fetch("/api/teams", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update team");
  }

  return response.json();
}

async function deleteTeam(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/teams?id=${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete team");
  }

  return response.json();
}

// Query Hooks
export function useTeams(options?: Omit<UseQueryOptions<ListResponse<Team>>, "queryKey" | "queryFn">) {
  return useQuery<ListResponse<Team>>({
    queryKey: ["teams"],
    queryFn: fetchTeams,
    ...options,
  });
}

export function useTeam(id: string, options?: Omit<UseQueryOptions<Team>, "queryKey" | "queryFn">) {
  return useQuery<Team>({
    queryKey: ["teams", id],
    queryFn: () => fetchTeam(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateTeam(options?: UseMutationOptions<Team, Error, CreateTeam>) {
  const queryClient = useQueryClient();
  return useMutation<Team, Error, CreateTeam>({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    ...options,
  });
}

export function useUpdateTeam(options?: UseMutationOptions<Team, Error, { id: string; data: Partial<Team> }>) {
  const queryClient = useQueryClient();
  return useMutation<Team, Error, { id: string; data: Partial<Team> }>({
    mutationFn: ({ id, data }) => updateTeam(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams", variables.id] });
    },
    ...options,
  });
}

export function useDeleteTeam(options?: UseMutationOptions<{ success: boolean }, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    ...options,
  });
}
