import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Sport, CreateSport } from "@/lib/schema";

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

export function useSports(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterType?: string
) {
  const data = useQuery(api.sports.list, {
    page,
    limit,
    sortBy,
    sortOrder,
    filterName,
    filterType,
  });

  return { data: data as ListResponse<Sport> | undefined, isLoading: data === undefined };
}

export function useSport(id: string) {
  const data = useQuery(api.sports.get, id ? { id: id as Id<"sports"> } : "skip");
  return { data: data as Sport | null | undefined, isLoading: id ? data === undefined : false };
}

export function useCreateSport(options?: MutationOptions<Sport | null>) {
  return useConvexMutation<CreateSport, Sport | null>(
    api.sports.create as any,
    options,
    (data) => ({ data })
  );
}

export function useUpdateSport(options?: MutationOptions<Sport | null>) {
  return useConvexMutation<{ id: string; data: Partial<Sport> }, Sport | null>(
    api.sports.update as any,
    options
  );
}

export function useDeleteSport(options?: MutationOptions<{ success: boolean; id: string }>) {
  const mutation = useMutation(api.sports.remove as any);
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
