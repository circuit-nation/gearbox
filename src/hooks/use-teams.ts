import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Team, CreateTeam } from "@/lib/schema";
import { Id } from "../../convex/_generated/dataModel";

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

export function useTeams(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterName?: string,
  filterSport?: string
) {
  const data = useQuery(api.teams.list, {
    page,
    limit,
    sortBy,
    sortOrder,
    filterName,
    filterSport,
  });

  return { data: data as ListResponse<Team> | undefined, isLoading: data === undefined };
}

export function useTeam(id: string) {
  const data = useQuery(api.teams.get, id ? { id: id as Id<"teams"> } : "skip");
  return { data: data as Team | null | undefined, isLoading: id ? data === undefined : false };
}

export function useCreateTeam(options?: MutationOptions<Team | null>) {
  return useConvexMutation<CreateTeam, Team | null>(
    api.teams.create as any,
    options,
    (data) => ({ data })
  );
}

export function useUpdateTeam(options?: MutationOptions<Team | null>) {
  return useConvexMutation<{ id: string; data: Partial<Team> }, Team | null>(
    api.teams.update as any,
    options
  );
}

export function useDeleteTeam(options?: MutationOptions<{ success: boolean; id: string }>) {
  const mutation = useMutation(api.teams.remove as any);
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
