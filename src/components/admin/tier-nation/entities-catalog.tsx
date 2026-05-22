"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmationDialog } from "@/components/shared/confirm-dialog";
import { useDeleteDialogState, useTableState } from "@/components/admin/manager-state";
import { useAdminEntitiesList, useDeleteEntity } from "@/hooks/use-tn-admin";
import { CreateEntitiesDialog } from "@/components/admin/tier-nation/create-entities-dialog";
import { EditEntityDialog } from "@/components/admin/tier-nation/edit-entity-dialog";
import { Plus, RefreshCw } from "lucide-react";
import {
  createTierNationEntityColumns,
  paginate,
  sortData,
} from "@/components/admin/tier-nation/catalog-shared";
import type { PublicTierListEntity } from "@/lib/tier-nation/types";
import { toast } from "sonner";

const ENTITY_LIST_PAGE = 1;
const ENTITY_LIST_LIMIT = 500;

export function TierNationEntitiesCatalog() {
  const queryClient = useQueryClient();
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<PublicTierListEntity | null>(null);
  const entityTable = useTableState([{ id: "name", desc: false }]);

  const { deleteConfirmOpen, setDeleteConfirmOpen, deleteTargetId, requestDelete, clearDelete } =
    useDeleteDialogState<string>();

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

  const entitiesQuery = useAdminEntitiesList(ENTITY_LIST_PAGE, ENTITY_LIST_LIMIT);
  const entityRows = entitiesQuery.data?.entities ?? [];

  const sortedEntities = useMemo(
    () =>
      sortData(
        entityRows as unknown as Record<string, unknown>[],
        entityTable.sortBy,
        entityTable.sortOrder as "asc" | "desc" | undefined
      ) as PublicTierListEntity[],
    [entityRows, entityTable.sortBy, entityTable.sortOrder]
  );

  const entityPage = paginate(
    sortedEntities,
    entityTable.pagination.pageIndex,
    entityTable.pagination.pageSize
  );

  const entityColumns = useMemo(
    () =>
      createTierNationEntityColumns({
        onEdit: (row) => setEditingEntity(row),
        onDelete: (row) => requestDelete(row.id),
        pendingEntityId: deleteEntity.isPending ? deleteTargetId : null,
      }),
    [requestDelete, deleteEntity.isPending, deleteTargetId]
  );

  const invalidateCatalog = () => queryClient.invalidateQueries({ queryKey: ["tier-nation"] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={() => setEntityDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New entities
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => invalidateCatalog()}
          disabled={entitiesQuery.isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${entitiesQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entities</CardTitle>
          <CardDescription>
            All entities in Tier Nation, including those not attached to any list.
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
            isLoading={entitiesQuery.isLoading}
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
        description="This removes the entity everywhere it is used."
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
