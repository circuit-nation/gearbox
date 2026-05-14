"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  ListOrdered,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DataTable, createSortableHeader } from "@/components/admin/data-table";
import {
  useDeleteDialogState,
  useTableState,
} from "@/components/admin/manager-state";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { useTierNationListDetail } from "@/hooks/use-tn-catalog";
import {
  useArchiveTierList,
  useDeleteTierList,
  useRemoveEntityFromList,
  useReorderListEntities,
} from "@/hooks/use-tn-admin";
import { CreateEntitiesDialog } from "@/components/admin/tier-nation/create-entities-dialog";
import { EditListDialog } from "@/components/admin/tier-nation/edit-list-dialog";
import { EditEntityDialog } from "@/components/admin/tier-nation/edit-entity-dialog";
import type { PublicTierListEntity } from "@/lib/tier-nation/types";
import { ImageValueAvatar } from "@/components/admin/image-value-avatar";
import { useResolvedImageUrl } from "@/hooks/use-image-upload";
import Image from "next/image";

function paginate<T>(rows: T[], pageIndex: number, pageSize: number) {
  const start = pageIndex * pageSize;
  return rows.slice(start, start + pageSize);
}

function compareCell(a: unknown, b: unknown) {
  const sa = a == null ? "" : String(a);
  const sb = b == null ? "" : String(b);
  return sa.localeCompare(sb);
}

function sortData<T extends Record<string, unknown>>(
  rows: T[],
  sortBy: string | undefined,
  sortOrder: "asc" | "desc" | undefined,
) {
  if (!sortBy) return rows;
  const mult = sortOrder === "asc" ? 1 : -1;
  return [...rows].sort((x, y) => mult * compareCell(x[sortBy], y[sortBy]));
}

type ListDetailManagerProps = {
  listId: string;
};

export function TierNationListDetailManager({
  listId,
}: ListDetailManagerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } =
    useTierNationListDetail(listId);
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [editListOpen, setEditListOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<PublicTierListEntity | null>(null);

  const entityTable = useTableState([{ id: "name", desc: false }]);
  const {
    deleteConfirmOpen: archiveConfirmOpen,
    setDeleteConfirmOpen: setArchiveConfirmOpen,
    deleteTargetId: archiveTargetId,
    requestDelete: requestArchive,
    clearDelete: clearArchive,
  } = useDeleteDialogState<string>();

  const {
    deleteConfirmOpen: hardDeleteOpen,
    setDeleteConfirmOpen: setHardDeleteOpen,
    deleteTargetId: hardDeleteTargetId,
    requestDelete: requestHardDelete,
    clearDelete: clearHardDelete,
  } = useDeleteDialogState<string>();

  const {
    deleteConfirmOpen: removeEntityOpen,
    setDeleteConfirmOpen: setRemoveEntityOpen,
    deleteTargetId: removeEntityId,
    requestDelete: requestRemoveEntity,
    clearDelete: clearRemoveEntity,
  } = useDeleteDialogState<string>();

  const archiveList = useArchiveTierList({
    onSuccess: () => {
      toast.success("List archived.");
      clearArchive();
      queryClient.invalidateQueries({ queryKey: ["tier-nation"] });
    },
    onError: (e) => {
      toast.error(e.message);
      clearArchive();
    },
  });

  const deleteList = useDeleteTierList({
    onSuccess: () => {
      toast.success("List deleted.");
      clearHardDelete();
      queryClient.invalidateQueries({ queryKey: ["tier-nation"] });
      router.push("/tier-nation/lists");
    },
    onError: (e) => {
      toast.error(e.message);
      clearHardDelete();
    },
  });

  const removeFromList = useRemoveEntityFromList({
    onSuccess: () => {
      toast.success("Entity removed from list.");
      clearRemoveEntity();
      queryClient.invalidateQueries({ queryKey: ["tier-nation"] });
    },
    onError: (e) => {
      toast.error(e.message);
      clearRemoveEntity();
    },
  });

  const reorderEntities = useReorderListEntities({
    onSuccess: () => {
      toast.success("Entity order saved.");
      queryClient.invalidateQueries({ queryKey: ["tier-nation"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const entities = data?.entities ?? [];
  const sortedEntities = useMemo(
    () =>
      sortData(
        entities as unknown as Record<string, unknown>[],
        entityTable.sortBy,
        entityTable.sortOrder as "asc" | "desc" | undefined,
      ) as PublicTierListEntity[],
    [entities, entityTable.sortBy, entityTable.sortOrder],
  );
  const entityPage = useMemo(
    () =>
      paginate(
        sortedEntities,
        entityTable.pagination.pageIndex,
        entityTable.pagination.pageSize,
      ),
    [
      sortedEntities,
      entityTable.pagination.pageIndex,
      entityTable.pagination.pageSize,
    ],
  );

  const entityColumns = useMemo<ColumnDef<PublicTierListEntity>[]>(
    () => [
      {
        accessorKey: "name",
        header: createSortableHeader("Name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.imageUrl ? (
              <ImageValueAvatar
                value={row.original.imageUrl}
                alt={row.original.name}
                fallback={row.original.name.slice(0, 2).toUpperCase()}
                className="h-8 w-8"
              />
            ) : null}
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "team",
        header: createSortableHeader("Team"),
        cell: ({ row }) => row.original.team || "—",
      },
      {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => (
          <code className="text-xs text-muted-foreground">{row.original.id}</code>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.tags?.length ? row.original.tags.join(", ") : "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingEntity(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                removeFromList.isPending && removeEntityId === row.original.id
              }
              onClick={() => requestRemoveEntity(row.original.id)}
              title="Remove from this list"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [
      removeFromList.isPending,
      removeEntityId,
      requestRemoveEntity,
    ],
  );

  const cover = data?.coverImage?.trim();
  const { url, isLoading: isCoverLoading } = useResolvedImageUrl(cover);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading list…</div>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          {error?.message || "List not found."}
        </p>
        <Button variant="outline" asChild>
          <Link href="/tier-nation/lists">Back to catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tier-nation/lists" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Catalog
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button type="button" variant="secondary" onClick={() => setEditListOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit list
        </Button>
        <Button type="button" onClick={() => setEntityDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add entities
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sortedEntities.length === 0 || reorderEntities.isPending}
          onClick={() =>
            reorderEntities.mutate({
              listId,
              body: {
                order: sortedEntities.map((e, i) => ({
                  entityId: e.id,
                  sortOrder: i,
                })),
              },
            })
          }
        >
          <ListOrdered className="mr-2 h-4 w-4" />
          Save entity order
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => requestArchive(listId)}
        >
          Archive list…
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => requestHardDelete(listId)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete list…
        </Button>
      </div>

      <div className="relative">
        {cover ? (
          <div className="relative h-48 w-full overflow-hidden rounded-xl">
            {isCoverLoading ? null : (
              <Image
                src={url}
                alt={data.name}
                className="object-cover"
                width={5000}
                height={5000}
              />
            )}
            <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/80" />

            <div className="absolute bottom-0 left-0 right-0 space-y-1 p-4 text-white">
              <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
              <p className="text-sm text-white/70">
                {data.description || "No description."}
              </p>
            </div>
          </div>
        ) : (
          <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
        )}

        <div className="space-y-2 pt-3">
          {!cover && (
            <p className="text-muted-foreground">
              {data.description || "No description."}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge variant={data.isVisible ? "secondary" : "outline"}>
              {data.isVisible ? "Visible" : "Hidden"}
            </Badge>
            <Badge variant="outline">
              {data.isLocked ? "Locked" : "Unlocked"}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Id:</span>{" "}
              <code className="rounded bg-muted px-1">{data.id}</code>
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground text-sm"
                onClick={() => navigator.clipboard.writeText(data.id)}
              >
                <Copy />
              </Button>
            </div>

            {data.startTime ? (
              <div>Starts: {format(new Date(data.startTime), "PPp")}</div>
            ) : null}

            {data.endTime ? (
              <div>Ends: {format(new Date(data.endTime), "PPp")}</div>
            ) : null}
          </div>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Entities on this list</CardTitle>
          <CardDescription>
            Public catalog data with admin actions: PATCH entity, remove link (DELETE
            /admin/lists/:listId/entities/:entityId), PATCH order for the current sorted
            order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={entityPage}
            columns={entityColumns}
            sorting={entityTable.sorting}
            onSortingChange={entityTable.setSorting}
            pagination={entityTable.pagination}
            onPaginationChange={entityTable.setPagination}
            totalCount={sortedEntities.length}
            isLoading={false}
          />
        </CardContent>
      </Card>

      <CreateEntitiesDialog
        open={entityDialogOpen}
        onOpenChange={setEntityDialogOpen}
        defaultListId={listId}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["tier-nation"] })
        }
      />

      <EditListDialog
        open={editListOpen}
        onOpenChange={setEditListOpen}
        list={data}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ["tier-nation"] })
        }
      />

      {editingEntity ? (
        <EditEntityDialog
          open={Boolean(editingEntity)}
          onOpenChange={(open) => {
            if (!open) setEditingEntity(null);
          }}
          entityId={editingEntity.id}
          initial={{
            name: editingEntity.name,
            description: editingEntity.description,
            team: editingEntity.team,
            tags: editingEntity.tags,
            imageUrl: editingEntity.imageUrl,
          }}
          onSaved={() =>
            queryClient.invalidateQueries({ queryKey: ["tier-nation"] })
          }
        />
      ) : null}

      <ConfirmationDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="Archive this list?"
        description="Soft-delete via PATCH /admin/lists/:id/archive."
        confirmText="Archive"
        onConfirm={() => {
          if (archiveTargetId) {
            archiveList.mutate(archiveTargetId);
          }
        }}
        isLoading={archiveList.isPending}
      />

      <ConfirmationDialog
        open={hardDeleteOpen}
        onOpenChange={setHardDeleteOpen}
        title="Delete this list permanently?"
        description="DELETE /admin/lists/:id — cannot be undone."
        confirmText="Delete permanently"
        onConfirm={() => {
          const id = hardDeleteTargetId ?? listId;
          deleteList.mutate(id);
        }}
        isLoading={deleteList.isPending}
      />

      <ConfirmationDialog
        open={removeEntityOpen}
        onOpenChange={setRemoveEntityOpen}
        title="Remove entity from this list?"
        description="DELETE /admin/lists/:listId/entities/:entityId — the entity record may still exist."
        confirmText="Remove"
        onConfirm={() => {
          if (removeEntityId) {
            removeFromList.mutate({ listId, entityId: removeEntityId });
          }
        }}
        isLoading={removeFromList.isPending}
      />
    </div>
  );
}
