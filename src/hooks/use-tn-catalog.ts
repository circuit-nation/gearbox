import { useQuery, useQueries } from "@tanstack/react-query";
import { buildQuery, fetchJson } from "@/lib/api-client";
import type {
  PublicListDetail,
  PublicListsResponse,
  PublicTierListEntity,
  PublicTierListSummary,
} from "@/lib/tier-nation/types";

const CATALOG_LIMIT = 100;

export function useTierNationPublicLists(page: number = 1, limit: number = CATALOG_LIMIT) {
  return useQuery({
    queryKey: ["tier-nation", "catalog", "lists", page, limit],
    queryFn: () =>
      fetchJson<PublicListsResponse>(
        `/api/tier-nation/catalog/lists${buildQuery({ page, limit })}`
      ),
  });
}

export function useTierNationListDetail(id: string) {
  return useQuery({
    queryKey: ["tier-nation", "catalog", "list", id],
    queryFn: () => fetchJson<PublicListDetail>(`/api/tier-nation/catalog/lists/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  });
}

export type CatalogEntityRow = PublicTierListEntity & {
  listId: string;
  listName: string;
};

/**
 * Fetches `GET /lists/:id` for each list on the current catalog page and merges `entities`
 * with parent list metadata (for a combined entities table).
 */
export function useTierNationCatalogEntityRows(
  lists: PublicTierListSummary[] | undefined,
  enabled: boolean
) {
  const queries = useQueries({
    queries: (lists ?? []).map((list) => ({
      queryKey: ["tier-nation", "catalog", "list", list.id],
      queryFn: () =>
        fetchJson<PublicListDetail>(`/api/tier-nation/catalog/lists/${encodeURIComponent(list.id)}`),
      enabled: enabled && Boolean(list.id),
      staleTime: 30_000,
    })),
  });

  const merged: CatalogEntityRow[] = [];
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  (lists ?? []).forEach((list, i) => {
    const detail = queries[i]?.data;
    const name = list.name;
    for (const e of detail?.entities ?? []) {
      merged.push({
        ...e,
        listId: list.id,
        listName: name,
      });
    }
  });

  return { rows: merged, isLoading, isError };
}
