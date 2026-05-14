# Tier Nation — Data & API Guidelines

> Collections: `entities` · `lists`
> Backend: External Tier Nation API (URL stored in env variables)

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [API Client](#api-client)
4. [Types](#types)
5. [Zod Validators](#zod-validators)
6. [TanStack Query Keys & Hooks](#tanstack-query-keys--hooks)
7. [UI Components](#ui-components)
8. [Error Handling Rules](#error-handling-rules)

---

## Overview

Tier Nation has its own backend API that lives outside this admin dashboard. The admin dashboard communicates with it over HTTP using environment-configured base URLs. There is **no direct database access** from this project for Tier Nation data — all operations go through the Tier Nation API.

The two primary resources are:
- **Entities** — individual items managed in Tier Nation.
- **Lists** — curated ordered collections of entities.

Both support full **CRUD** operations.

**Security rule:** The Tier Nation API base URL, API keys, and any authentication tokens are **never exposed to the browser**. All Tier Nation API calls are proxied through Next.js API routes in this project. The client always calls `/api/tier-nation/*`, never the Tier Nation backend directly.

---

## Environment Variables

```env
# .env.local — server only, never NEXT_PUBLIC_
TN_API_BASE_URL=https://api.tiernation.io/v2
```

These are used exclusively inside `/app/api/tier-nation/` route handlers. They are never referenced in any `"use client"` file.

---

## Proxy API Routes

Next.js API routes act as a secure proxy. The client never knows the Tier Nation backend URL.

```
/app/api/tier-nation/
  /entities
    route.ts          ← GET (list), POST (create)
    /[id]
      route.ts        ← GET, PATCH, DELETE
  /lists
    route.ts          ← GET, POST
    /[id]
      route.ts        ← GET, PATCH, DELETE
      /entities
        route.ts      ← GET (entities in list), POST (add entity to list), DELETE
```

### Tier Nation HTTP Client (Server-Side Only)
For authorization, the Tier Nation uses the [require-dashboard-session](/Users/pranavtripathi/Documents/circuit-nation/admin/src/lib/auth/require-dashboard-session.ts)


---

## API Client

The admin-side API client calls the local proxy routes — it knows nothing about the Tier Nation backend.

```ts
// lib/tier-nation/api.ts
import type { Entity, TierList } from "./types";

const BASE = "/api/tier-nation";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? "An unexpected error occurred.");
  }

  return json.data as T;
}

export const tnApi = {
  entities: {
    list:   (search?: string) =>
      request<Entity[]>(`/entities${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    get:    (id: string) => request<Entity>(`/entities/${id}`),
    create: (data: Partial<Entity>) =>
      request<Entity>("/entities", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Entity>) =>
      request<Entity>(`/entities/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/entities/${id}`, { method: "DELETE" }),
  },

  lists: {
    list:   () => request<TierList[]>("/lists"),
    get:    (id: string) => request<TierList>(`/lists/${id}`),
    create: (data: Partial<TierList>) =>
      request<TierList>("/lists", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<TierList>) =>
      request<TierList>(`/lists/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/lists/${id}`, { method: "DELETE" }),

    // Entities within a list
    getEntities:    (listId: string) => request<Entity[]>(`/lists/${listId}/entities`),
    addEntity:      (listId: string, entityId: string) =>
      request<TierList>(`/lists/${listId}/entities`, {
        method: "POST", body: JSON.stringify({ entityId }),
      }),
    removeEntity:   (listId: string, entityId: string) =>
      request<{ success: boolean }>(`/lists/${listId}/entities`, {
        method: "DELETE", body: JSON.stringify({ entityId }),
      }),
  },
};
```

## TanStack Query Keys & Hooks

```ts
// lib/tier-nation/queries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tnApi } from "./api";

// ── Query Key Factory ──────────────────────────────────────────────────────

export const tnKeys = {
  all: ["tn"] as const,
  entities: {
    all:    () => [...tnKeys.all, "entities"] as const,
    list:   (search?: string) => [...tnKeys.entities.all(), "list", search] as const,
    detail: (id: string) => [...tnKeys.entities.all(), id] as const,
  },
  lists: {
    all:      () => [...tnKeys.all, "lists"] as const,
    list:     () => [...tnKeys.lists.all(), "list"] as const,
    detail:   (id: string) => [...tnKeys.lists.all(), id] as const,
    entities: (id: string) => [...tnKeys.lists.all(), id, "entities"] as const,
  },
};

// ── Entities ───────────────────────────────────────────────────────────────

export const useEntities = (search?: string) =>
  useQuery({ queryKey: tnKeys.entities.list(search), queryFn: () => tnApi.entities.list(search) });

export const useEntity = (id: string) =>
  useQuery({ queryKey: tnKeys.entities.detail(id), queryFn: () => tnApi.entities.get(id), enabled: !!id });

export const useCreateEntity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tnApi.entities.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: tnKeys.entities.all() }),
  });
};

export const useUpdateEntity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof tnApi.entities.update>[1] }) =>
      tnApi.entities.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: tnKeys.entities.all() });
      qc.invalidateQueries({ queryKey: tnKeys.entities.detail(id) });
    },
  });
};

export const useDeleteEntity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tnApi.entities.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: tnKeys.entities.all() }),
  });
};

// ── Lists ──────────────────────────────────────────────────────────────────

export const useLists = () =>
  useQuery({ queryKey: tnKeys.lists.list(), queryFn: tnApi.lists.list });

export const useList = (id: string) =>
  useQuery({ queryKey: tnKeys.lists.detail(id), queryFn: () => tnApi.lists.get(id), enabled: !!id });

export const useListEntities = (listId: string) =>
  useQuery({
    queryKey: tnKeys.lists.entities(listId),
    queryFn: () => tnApi.lists.getEntities(listId),
    enabled: !!listId,
  });

export const useCreateList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tnApi.lists.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: tnKeys.lists.all() }),
  });
};

export const useUpdateList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof tnApi.lists.update>[1] }) =>
      tnApi.lists.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: tnKeys.lists.all() });
      qc.invalidateQueries({ queryKey: tnKeys.lists.detail(id) });
    },
  });
};

export const useDeleteList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tnApi.lists.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: tnKeys.lists.all() }),
  });
};

export const useAddEntityToList = (listId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entityId: string) => tnApi.lists.addEntity(listId, entityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tnKeys.lists.entities(listId) });
      qc.invalidateQueries({ queryKey: tnKeys.lists.detail(listId) });
    },
  });
};

export const useRemoveEntityFromList = (listId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entityId: string) => tnApi.lists.removeEntity(listId, entityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tnKeys.lists.entities(listId) });
    },
  });
};
```

---

## UI Components

### Entities Page

```tsx
// app/(dashboard)/tier-nation/entities/page.tsx
"use client";

import { useEntities, useDeleteEntity } from "@/lib/tier-nation/queries";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { SkeletonTable } from "@/components/shared/skeleton-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { entityColumns } from "@/components/tier-nation/entities/entity-columns";
import { CreateEntityDialog } from "@/components/tier-nation/entities/create-entity-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import type { Entity } from "@/lib/tier-nation/types";

export default function EntitiesPage() {
  const { data: entities, isLoading } = useEntities();
  const deleteEntity = useDeleteEntity();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Entity | null>(null);

  const columns = entityColumns({ onDelete: setDeleteTarget });

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEntity.mutateAsync(deleteTarget.id);
      toast.success("Entity deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete entity. Please try again.");
    }
  }

  return (
    <>
      <PageHeader
        title="Entities"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Entity
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={6} columns={4} />
      ) : (
        <DataTable
          columns={columns}
          data={entities ?? []}
          searchKey="name"
          searchPlaceholder="Search entities..."
        />
      )}

      <CreateEntityDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete entity?"
        description="This entity will be permanently removed."
        onConfirm={handleDelete}
        loading={deleteEntity.isPending}
      />
    </>
  );
}
```

---

## Error Handling Rules

| Situation | What the admin sees | What is logged |
|---|---|---|
| TN API returns 401 | "You don't have permission to perform this action." | `[TierNation] PATCH /entities/123 → 401` |
| TN API returns 500 | "Something went wrong. Please try again." | Full response body in `console.error` |
| Network timeout | "Unable to connect. Check your connection." | Error stack |
| Validation fails | Form field errors from Zod | — |
| Entity not found (404) | "This item no longer exists." | `console.warn` |

- **Never** put the TN API base URL in any error message, toast, or console output that could be read by the admin in the browser.
- **Always** use the proxy pattern — the admin only ever sees `/api/tier-nation/*` in Network DevTools.
