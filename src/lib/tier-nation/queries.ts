import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { tnApi } from "@/lib/tier-nation/api";
import type {
  AdminEntitiesBody,
  EntityAdminResponse,
  LinkEntitiesToListBody,
  MessageResponse,
  PublicListDetail,
  PublicListsResponse,
  PublicTierListEntity,
  PublicTierListSummary,
  ReorderListEntitiesRequest,
  TierListResponse,
  UpdateEntityRequest,
  UpdateTierListRequest,
  CreateTierListRequest,
} from "@/lib/tier-nation/types";

type MutationOptions<TResult, TVariables = unknown> = {
  onSuccess?: (data: TResult, variables: TVariables) => void;
  onError?: (error: Error) => void;
};

type ArchiveMutationOptions = {
  onSuccess?: (data: MessageResponse, listId: string) => void;
  onError?: (error: Error) => void;
};

export const tnKeys = {
  all: ["tier-nation"] as const,
  auth: {
    all: () => [...tnKeys.all, "auth"] as const,
    session: () => [...tnKeys.auth.all(), "session"] as const,
  },
  catalog: {
    all: () => [...tnKeys.all, "catalog"] as const,
    lists: (page: number, limit: number) =>
      [...tnKeys.catalog.all(), "lists", page, limit] as const,
    list: (id: string) => [...tnKeys.catalog.all(), "list", id] as const,
  },
  admin: {
    all: () => [...tnKeys.all, "admin"] as const,
    entities: (page: number, limit: number, search?: string) =>
      [...tnKeys.admin.all(), "entities", page, limit, search ?? ""] as const,
  },
};

const CATALOG_LIMIT = 100;

export function useTierNationPublicLists(page: number = 1, limit: number = CATALOG_LIMIT) {
  return useQuery({
    queryKey: tnKeys.catalog.lists(page, limit),
    queryFn: () => tnApi.catalog.lists(page, limit),
  });
}

export function useTierNationListDetail(id: string) {
  return useQuery({
    queryKey: tnKeys.catalog.list(id),
    queryFn: () => tnApi.catalog.listDetail(id),
    enabled: Boolean(id),
  });
}

/** @deprecated Prefer PublicTierListEntity from useAdminEntitiesList */
export type CatalogEntityRow = PublicTierListEntity & {
  listId: string;
  listName: string;
};

export function useAdminEntitiesList(page = 1, limit = 100, search?: string) {
  return useQuery({
    queryKey: tnKeys.admin.entities(page, limit, search),
    queryFn: () => tnApi.admin.entities.list(page, limit, search),
  });
}

export function useTierNationCatalogEntityRows(
  lists: PublicTierListSummary[] | undefined,
  enabled: boolean
) {
  const queries = useQueries({
    queries: (lists ?? []).map((list) => ({
      queryKey: tnKeys.catalog.list(list.id),
      queryFn: () => tnApi.catalog.listDetail(list.id),
      enabled: enabled && Boolean(list.id),
      staleTime: 30_000,
    })),
  });

  const merged: CatalogEntityRow[] = [];
  const isLoading = queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError);

  (lists ?? []).forEach((list, index) => {
    const detail = queries[index]?.data;
    for (const entity of detail?.entities ?? []) {
      merged.push({
        ...entity,
        listId: list.id,
        listName: list.name,
      });
    }
  });

  return { rows: merged, isLoading, isError };
}

export function useCreateTierList(
  options?: MutationOptions<TierListResponse, CreateTierListRequest>
) {
  const mutation = useMutation({
    mutationFn: (body: CreateTierListRequest) => tnApi.admin.lists.create(body),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useCreateStandaloneEntities(
  options?: MutationOptions<MessageResponse, AdminEntitiesBody>
) {
  const mutation = useMutation({
    mutationFn: (body: AdminEntitiesBody) => tnApi.admin.entities.createStandalone(body),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useAddEntitiesToList(
  options?: MutationOptions<MessageResponse, { listId: string; body: AdminEntitiesBody }>
) {
  const mutation = useMutation({
    mutationFn: (payload: { listId: string; body: AdminEntitiesBody }) =>
      tnApi.admin.lists.addEntities(payload.listId, payload.body),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useLinkEntitiesToList(
  options?: MutationOptions<MessageResponse, { listId: string; body: LinkEntitiesToListBody }>
) {
  const mutation = useMutation({
    mutationFn: (payload: { listId: string; body: LinkEntitiesToListBody }) =>
      tnApi.admin.lists.linkEntities(payload.listId, payload.body),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useArchiveTierList(options?: ArchiveMutationOptions) {
  const mutation = useMutation({
    mutationFn: (listId: string) => tnApi.admin.lists.archive(listId),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateTierList(
  options?: MutationOptions<TierListResponse, { listId: string; body: UpdateTierListRequest }>
) {
  const mutation = useMutation({
    mutationFn: (payload: { listId: string; body: UpdateTierListRequest }) =>
      tnApi.admin.lists.update(payload.listId, payload.body),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteTierList(options?: MutationOptions<MessageResponse | undefined, string>) {
  const mutation = useMutation({
    mutationFn: (listId: string) => tnApi.admin.lists.delete(listId),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateEntity(
  options?: MutationOptions<EntityAdminResponse, { entityId: string; body: UpdateEntityRequest }>
) {
  const mutation = useMutation({
    mutationFn: (payload: { entityId: string; body: UpdateEntityRequest }) =>
      tnApi.admin.entities.update(payload.entityId, payload.body),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteEntity(options?: MutationOptions<MessageResponse | undefined, string>) {
  const mutation = useMutation({
    mutationFn: (entityId: string) => tnApi.admin.entities.delete(entityId),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useRemoveEntityFromList(
  options?: MutationOptions<MessageResponse | undefined, { listId: string; entityId: string }>
) {
  const mutation = useMutation({
    mutationFn: (payload: { listId: string; entityId: string }) =>
      tnApi.admin.lists.removeEntity(payload.listId, payload.entityId),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useReorderListEntities(
  options?: MutationOptions<MessageResponse, { listId: string; body: ReorderListEntitiesRequest }>
) {
  const mutation = useMutation({
    mutationFn: (payload: { listId: string; body: ReorderListEntitiesRequest }) =>
      tnApi.admin.lists.reorderEntities(payload.listId, payload.body),
    onSuccess: (data, variables) => options?.onSuccess?.(data, variables),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useTierNationSessionStatus() {
  return useQuery({
    queryKey: tnKeys.auth.session(),
    queryFn: () => tnApi.auth.session(),
  });
}

export type { PublicListDetail, PublicListsResponse };
