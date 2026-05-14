import { useMutation } from "@tanstack/react-query";
import { fetchJson, fetchMutation } from "@/lib/api-client";
import type {
  AdminEntitiesBody,
  CreateTierListRequest,
  EntityAdminResponse,
  MessageResponse,
  ReorderListEntitiesRequest,
  TierListResponse,
  UpdateEntityRequest,
  UpdateTierListRequest,
} from "@/lib/tier-nation/types";

type MutationOptions<TResult> = {
  onSuccess?: (data: TResult) => void;
  onError?: (error: Error) => void;
};

type ArchiveMutationOptions = {
  onSuccess?: (data: MessageResponse, listId: string) => void;
  onError?: (error: Error) => void;
};

export function useCreateTierList(options?: MutationOptions<TierListResponse>) {
  const mutation = useMutation({
    mutationFn: (body: CreateTierListRequest) =>
      fetchJson<TierListResponse>("/api/tier-nation/admin/lists", {
        method: "POST",
        body,
      }),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useCreateStandaloneEntities(options?: MutationOptions<MessageResponse>) {
  const mutation = useMutation({
    mutationFn: (body: AdminEntitiesBody) =>
      fetchJson<MessageResponse>("/api/tier-nation/admin/entities", {
        method: "POST",
        body,
      }),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useAddEntitiesToList(options?: MutationOptions<MessageResponse>) {
  const mutation = useMutation({
    mutationFn: (payload: { listId: string; body: AdminEntitiesBody }) =>
      fetchJson<MessageResponse>(`/api/tier-nation/admin/lists/${payload.listId}/entities`, {
        method: "POST",
        body: payload.body,
      }),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useArchiveTierList(options?: ArchiveMutationOptions) {
  const mutation = useMutation({
    mutationFn: (listId: string) =>
      fetchJson<MessageResponse>(`/api/tier-nation/admin/lists/${listId}/archive`, {
        method: "PATCH",
      }),
    onSuccess: (data, listId) => {
      options?.onSuccess?.(data, listId);
    },
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateTierList(options?: MutationOptions<TierListResponse>) {
  const mutation = useMutation({
    mutationFn: (payload: { listId: string; body: UpdateTierListRequest }) =>
      fetchJson<TierListResponse>(`/api/tier-nation/admin/lists/${payload.listId}`, {
        method: "PATCH",
        body: payload.body,
      }),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteTierList(options?: MutationOptions<MessageResponse | undefined>) {
  const mutation = useMutation({
    mutationFn: (listId: string) =>
      fetchMutation<MessageResponse>(`/api/tier-nation/admin/lists/${listId}`, {
        method: "DELETE",
      }),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateEntity(options?: MutationOptions<EntityAdminResponse>) {
  const mutation = useMutation({
    mutationFn: (payload: { entityId: string; body: UpdateEntityRequest }) =>
      fetchJson<EntityAdminResponse>(`/api/tier-nation/admin/entities/${payload.entityId}`, {
        method: "PATCH",
        body: payload.body,
      }),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteEntity(options?: MutationOptions<MessageResponse | undefined>) {
  const mutation = useMutation({
    mutationFn: (entityId: string) =>
      fetchMutation<MessageResponse>(`/api/tier-nation/admin/entities/${entityId}`, {
        method: "DELETE",
      }),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useRemoveEntityFromList(options?: MutationOptions<MessageResponse | undefined>) {
  const mutation = useMutation({
    mutationFn: (payload: { listId: string; entityId: string }) =>
      fetchMutation<MessageResponse>(
        `/api/tier-nation/admin/lists/${payload.listId}/entities/${payload.entityId}`,
        { method: "DELETE" },
      ),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useReorderListEntities(options?: MutationOptions<MessageResponse>) {
  const mutation = useMutation({
    mutationFn: (payload: { listId: string; body: ReorderListEntitiesRequest }) =>
      fetchJson<MessageResponse>(`/api/tier-nation/admin/lists/${payload.listId}/entities/order`, {
        method: "PATCH",
        body: payload.body,
      }),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: options?.onError,
  });

  return { mutate: mutation.mutateAsync, isPending: mutation.isPending };
}
