"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Copy, Link2, ListOrdered, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/shared/data-table";
import { useDeleteDialogState, useTableState } from "@/components/admin/manager-state";
import { ConfirmationDialog } from "@/components/shared/confirm-dialog";
import { useTierNationListDetail } from "@/hooks/use-tn-catalog";
import {
  useArchiveTierList,
  useDeleteTierList,
  useRemoveEntityFromList,
  useReorderListEntities,
} from "@/hooks/use-tn-admin";
import { AddExistingEntitiesDialog } from "@/components/admin/tier-nation/add-existing-entities-dialog";
import { CreateEntitiesDialog } from "@/components/admin/tier-nation/create-entities-dialog";
import { EditListDialog } from "@/components/admin/tier-nation/edit-list-dialog";
import { EditEntityDialog } from "@/components/admin/tier-nation/edit-entity-dialog";
import type { PublicTierListEntity } from "@/lib/tier-nation/types";
import { useResolvedImageUrl } from "@/hooks/use-image-upload";
import Image from "next/image";
import { createListDetailColumns } from "@/components/admin/tier-nation/list-detail-columns";

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
  sortOrder: "asc" | "desc" | undefined
) {
  if (!sortBy) return rows;
  const mult = sortOrder === "asc" ? 1 : -1;
  return [...rows].sort((x, y) => mult * compareCell(x[sortBy], y[sortBy]));
}

type ListDetailManagerProps = {
  listId: string;
};

export function TierNationListDetailManager({ listId }: ListDetailManagerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useTierNationListDetail(listId);
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [addExistingOpen, setAddExistingOpen] = useState(false);
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

  const sortedEntities = useMemo(() => {
    const entities = data?.entities ?? [];
    return sortData(
      entities as unknown as Record<string, unknown>[],
      entityTable.sortBy,
      entityTable.sortOrder as "asc" | "desc" | undefined
    ) as PublicTierListEntity[];
  }, [data?.entities, entityTable.sortBy, entityTable.sortOrder]);
  const entityPage = useMemo(
    () =>
      paginate(sortedEntities, entityTable.pagination.pageIndex, entityTable.pagination.pageSize),
    [sortedEntities, entityTable.pagination.pageIndex, entityTable.pagination.pageSize]
  );

  const entityColumns = useMemo(
    () =>
      createListDetailColumns({
        onEdit: setEditingEntity,
        onRemove: requestRemoveEntity,
        pendingEntityId: removeEntityId,
        isRemoving: removeFromList.isPending,
      }),
    [removeEntityId, removeFromList.isPending, requestRemoveEntity]
  );

  const cover = data?.coverImage?.trim();
  const { url, isLoading: isCoverLoading } = useResolvedImageUrl(cover);

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading list…</div>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">{error?.message || "List not found."}</p>
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
          Create entities
        </Button>
        <Button type="button" variant="secondary" onClick={() => setAddExistingOpen(true)}>
          <Link2 className="mr-2 h-4 w-4" />
          Add existing
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
        <Button type="button" variant="destructive" onClick={() => requestArchive(listId)}>
          Archive list…
        </Button>
        <Button type="button" variant="destructive" onClick={() => requestHardDelete(listId)}>
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

            <div className="absolute right-0 bottom-0 left-0 space-y-1 p-4 text-white">
              <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
              <p className="text-sm text-white/70">{data.description || "No description."}</p>
            </div>
          </div>
        ) : (
          <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
        )}

        <div className="space-y-2 pt-3">
          {!cover && (
            <p className="text-muted-foreground">{data.description || "No description."}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge variant={data.isVisible ? "secondary" : "outline"}>
              {data.isVisible ? "Visible" : "Hidden"}
            </Badge>
            <Badge variant="outline">{data.isLocked ? "Locked" : "Unlocked"}</Badge>
          </div>

          <div className="text-muted-foreground space-y-1 text-sm">
            <div>
              <span className="text-foreground font-medium">Id:</span>{" "}
              <code className="bg-muted rounded px-1">{data.id}</code>
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground text-sm"
                onClick={() => navigator.clipboard.writeText(data.id)}
              >
                <Copy />
              </Button>
            </div>

            {data.startTime ? <div>Starts: {format(new Date(data.startTime), "PPp")}</div> : null}

            {data.endTime ? <div>Ends: {format(new Date(data.endTime), "PPp")}</div> : null}
          </div>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Entities on this list</CardTitle>
          <CardDescription>
            Review entities linked to this list, update details, and manage list membership.
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
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["tier-nation"] })}
      />

      <AddExistingEntitiesDialog
        open={addExistingOpen}
        onOpenChange={setAddExistingOpen}
        listId={listId}
        excludeEntityIds={sortedEntities.map((e) => e.id)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["tier-nation"] })}
      />

      <EditListDialog
        open={editListOpen}
        onOpenChange={setEditListOpen}
        list={data}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["tier-nation"] })}
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
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["tier-nation"] })}
        />
      ) : null}

      <ConfirmationDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="Archive this list?"
        description="This hides the list from active catalog usage until restored."
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
        description="This permanently removes the list, its memberships, and list-scoped votes and submissions. Entities are not deleted and can be added to other lists."
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
        description="This removes the entity from this list only."
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
