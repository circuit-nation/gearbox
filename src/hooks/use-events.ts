import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { Event, CreateEvent } from "@/lib/schema";

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

export function useEvents(
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  filterTitle?: string,
  filterType?: string,
  filterLocation?: string
) {
  const data = useQuery(api.events.list, {
    page,
    limit,
    sortBy,
    sortOrder,
    filterTitle,
    filterType,
    filterLocation,
  });

  return { data: data as ListResponse<Event> | undefined, isLoading: data === undefined };
}

export function useEvent(id: string) {
  const data = useQuery(api.events.get, id ? { id: id as Id<"events"> } : "skip");
  return { data: data as Event | null | undefined, isLoading: id ? data === undefined : false };
}

export function useCreateEvent(options?: MutationOptions<Event | null>) {
  return useConvexMutation<CreateEvent, Event | null>(
    api.events.create as any,
    options,
    (data) => ({ data })
  );
}

export function useUpdateEvent(options?: MutationOptions<Event | null>) {
  return useConvexMutation<{ id: string; data: Partial<Event> }, Event | null>(
    api.events.update as any,
    options
  );
}

export function useDeleteEvent(options?: MutationOptions<{ success: boolean; id: string }>) {
  const mutation = useMutation(api.events.remove as any);
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
