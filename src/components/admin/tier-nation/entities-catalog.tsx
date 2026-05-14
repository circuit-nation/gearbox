"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { useDeleteDialogState, useTableState } from "@/components/admin/manager-state";
import {
  useTierNationCatalogEntityRows,
  useTierNationPublicLists,
  type CatalogEntityRow,
} from "@/hooks/use-tn-catalog";
import { useDeleteEntity } from "@/hooks/use-tn-admin";
import { CreateEntitiesDialog } from "@/components/admin/tier-nation/create-entities-dialog";
import { EditEntityDialog } from "@/components/admin/tier-nation/edit-entity-dialog";
import { Plus, RefreshCw } from "lucide-react";
import {
  createTierNationEntityColumns,
  paginate,
  sortData,
} from "@/components/admin/tier-nation/catalog-shared";
import { toast } from "sonner";

const ENTITY_SOURCE_PAGE = 1;
const ENTITY_SOURCE_LIMIT = 100;

export function TierNationEntitiesCatalog() {
  const queryClient = useQueryClient();
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<CatalogEntityRow | null>(null);
  const entityTable = useTableState([{ id: "name", desc: false }]);

  const {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteTargetId,
    requestDelete,
    clearDelete,
  } = useDeleteDialogState<string>();

  const deleteEntity = useDeleteEntity({
    onSuccess: () => {
      toast.success("Entity deleted.");
      clearDelete();
      queryClient.invalidateQueries({ queryKey: ["tier-nation"] });
    },
    onError: (e) => {
      toast.error(e.message);
      clearDelete();
    },
  });

  const listsQuery = useTierNationPublicLists(
    ENTITY_SOURCE_PAGE,
    ENTITY_SOURCE_LIMIT,
  );
  const lists = listsQuery.data?.lists ?? [];

  const { rows: entityRows, isLoading: entitiesLoading } =
    useTierNationCatalogEntityRows(
      lists,
      Boolean(listsQuery.isSuccess && lists.length > 0),
    );

  const sortedEntities = useMemo(
    () =>
      sortData(
        entityRows as unknown as Record<string, unknown>[],
        entityTable.sortBy,
        entityTable.sortOrder as "asc" | "desc" | undefined,
      ) as CatalogEntityRow[],
    [entityRows, entityTable.sortBy, entityTable.sortOrder],
  );

  const entityPage = paginate(
    sortedEntities,
    entityTable.pagination.pageIndex,
    entityTable.pagination.pageSize,
  );

  const entityColumns = useMemo(
    () =>
      createTierNationEntityColumns({
        onEdit: (row) => setEditingEntity(row),
        onDelete: (row) => requestDelete(row.id),
        pendingEntityId: deleteEntity.isPending ? deleteTargetId : null,
      }),
    [requestDelete, deleteEntity.isPending, deleteTargetId],
  );

  const invalidateCatalog = () =>
    queryClient.invalidateQueries({ queryKey: ["tier-nation"] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setEntityDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New entities
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => invalidateCatalog()}
          disabled={listsQuery.isFetching || entitiesLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${listsQuery.isFetching || entitiesLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entities</CardTitle>
        <CardDescription>
          Aggregated from public list detail. Edit or delete via admin PATCH/DELETE.
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
            isLoading={listsQuery.isLoading || entitiesLoading}
          />
        </CardContent>
      </Card>

      <CreateEntitiesDialog
        open={entityDialogOpen}
        onOpenChange={setEntityDialogOpen}
        onSuccess={invalidateCatalog}
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
          onSaved={invalidateCatalog}
        />
      ) : null}

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete this entity permanently?"
        description="DELETE /admin/entities/:id — removes the entity globally."
        confirmText="Delete"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteEntity.mutate(deleteTargetId);
          }
        }}
        isLoading={deleteEntity.isPending}
      />
    </div>
  );
}
