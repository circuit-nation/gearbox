import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { Sport, CreateSport } from "@/lib/schema";

interface ListResponse<T> {
  total: number;
  documents: T[];
}

// API Fetcher Functions
async function fetchSports(): Promise<ListResponse<Sport>> {
  const response = await fetch("/api/sports");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch sports");
  }

  return response.json();
}

async function fetchSport(id: string): Promise<Sport> {
  const response = await fetch(`/api/sports?id=${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch sport");
  }

  return response.json();
}

async function createSport(data: CreateSport): Promise<Sport> {
  const response = await fetch("/api/sports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create sport");
  }

  return response.json();
}

async function updateSport(id: string, data: Partial<Sport>): Promise<Sport> {
  const response = await fetch("/api/sports", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update sport");
  }

  return response.json();
}

async function deleteSport(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/sports?id=${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete sport");
  }

  return response.json();
}

// Query Hooks
export function useSports(options?: Omit<UseQueryOptions<ListResponse<Sport>>, "queryKey" | "queryFn">) {
  return useQuery<ListResponse<Sport>>({
    queryKey: ["sports"],
    queryFn: fetchSports,
    ...options,
  });
}

export function useSport(id: string, options?: Omit<UseQueryOptions<Sport>, "queryKey" | "queryFn">) {
  return useQuery<Sport>({
    queryKey: ["sports", id],
    queryFn: () => fetchSport(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateSport(options?: UseMutationOptions<Sport, Error, CreateSport>) {
  const queryClient = useQueryClient();
  return useMutation<Sport, Error, CreateSport>({
    mutationFn: createSport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
    },
    ...options,
  });
}

export function useUpdateSport(options?: UseMutationOptions<Sport, Error, { id: string; data: Partial<Sport> }>) {
  const queryClient = useQueryClient();
  return useMutation<Sport, Error, { id: string; data: Partial<Sport> }>({
    mutationFn: ({ id, data }) => updateSport(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      queryClient.invalidateQueries({ queryKey: ["sports", variables.id] });
    },
    ...options,
  });
}

export function useDeleteSport(options?: UseMutationOptions<{ success: boolean }, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteSport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
    },
    ...options,
  });
}
