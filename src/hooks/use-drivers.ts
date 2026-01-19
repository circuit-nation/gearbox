import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { Driver, CreateDriver } from "@/lib/schema";

interface ListResponse<T> {
  total: number;
  documents: T[];
}

// API Fetcher Functions
async function fetchDrivers(): Promise<ListResponse<Driver>> {
  const response = await fetch("/api/drivers");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch drivers");
  }

  return response.json();
}

async function fetchDriver(id: string): Promise<Driver> {
  const response = await fetch(`/api/drivers?id=${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch driver");
  }

  return response.json();
}

async function createDriver(data: CreateDriver): Promise<Driver> {
  const response = await fetch("/api/drivers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create driver");
  }

  return response.json();
}

async function updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
  const response = await fetch("/api/drivers", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update driver");
  }

  return response.json();
}

async function deleteDriver(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/drivers?id=${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete driver");
  }

  return response.json();
}

// Query Hooks
export function useDrivers(options?: Omit<UseQueryOptions<ListResponse<Driver>>, "queryKey" | "queryFn">) {
  return useQuery<ListResponse<Driver>>({
    queryKey: ["drivers"],
    queryFn: fetchDrivers,
    ...options,
  });
}

export function useDriver(id: string, options?: Omit<UseQueryOptions<Driver>, "queryKey" | "queryFn">) {
  return useQuery<Driver>({
    queryKey: ["drivers", id],
    queryFn: () => fetchDriver(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateDriver(options?: UseMutationOptions<Driver, Error, CreateDriver>) {
  const queryClient = useQueryClient();
  return useMutation<Driver, Error, CreateDriver>({
    mutationFn: createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
    ...options,
  });
}

export function useUpdateDriver(options?: UseMutationOptions<Driver, Error, { id: string; data: Partial<Driver> }>) {
  const queryClient = useQueryClient();
  return useMutation<Driver, Error, { id: string; data: Partial<Driver> }>({
    mutationFn: ({ id, data }) => updateDriver(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["drivers", variables.id] });
    },
    ...options,
  });
}

export function useDeleteDriver(options?: UseMutationOptions<{ success: boolean }, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
    ...options,
  });
}
