import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { Circuit, CreateCircuit } from "@/lib/schema";

interface ListResponse<T> {
  total: number;
  documents: T[];
}

type MutationOptions<TResult> = {
  onSuccess?: (data: TResult) => void;
  onError?: (error: Error) => void;
};

function useConvexMutation<TArgs, TResult>(
  mutationRef: (args: TArgs) => Promise<TResult>,
  options?: MutationOptions<TResult>,
  mapArgs?: (args: TArgs) => unknown
) {
  const mutation = useMutation(mutationRef as any);
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (args: TArgs) => {
      setIsPending(true);
      try {
        const payload = mapArgs ? mapArgs(args) : args;
        const result = await mutation(payload as any);
        options?.onSuccess?.(result as TResult);
        return result as TResult;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        options?.onError?.(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [mutation, options, mapArgs]
  );

  return { mutate, isPending };
}

export function useCircuits(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterCountry?: string,
  filterSport?: string
) {
  const data = useQuery(api.circuits.list, {
    page,
    limit,
    sortBy,
    sortOrder,
    filterName,
    filterCountry,
    filterSport,
  });

  return { data: data as ListResponse<Circuit> | undefined, isLoading: data === undefined };
}

export function useCircuit(id: string) {
  const data = useQuery(api.circuits.get, id ? { id: id as Id<"circuits"> } : "skip");
  return { data: data as Circuit | null | undefined, isLoading: id ? data === undefined : false };
}

export function useCreateCircuit(options?: MutationOptions<Circuit | null>) {
  return useConvexMutation<CreateCircuit, Circuit | null>(
    api.circuits.create as any,
    options,
    (data) => ({ data })
  );
}

export function useUpdateCircuit(options?: MutationOptions<Circuit | null>) {
  return useConvexMutation<{ id: string; data: Partial<Circuit> }, Circuit | null>(
    api.circuits.update as any,
    options
  );
}

export function useDeleteCircuit(options?: MutationOptions<{ success: boolean; id: string }>) {
  const mutation = useMutation(api.circuits.remove as any);
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (id: string) => {
      setIsPending(true);
      try {
        const result = await mutation({ id } as any);
        options?.onSuccess?.(result as { success: boolean; id: string });
        return result as { success: boolean; id: string };
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        options?.onError?.(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [mutation, options]
  );

  return { mutate, isPending };
}

export function useCircuitsByIds(ids: string[]) {
  const data = useQuery(
    api.circuits.getMany,
    ids.length ? { ids: ids as Id<"circuits">[] } : "skip"
  );

  return {
    data: data as Circuit[] | undefined,
    isLoading: ids.length ? data === undefined : false,
  };
}
