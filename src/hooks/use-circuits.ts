import { useQuery } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { Circuit } from "@/lib/schema";

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
