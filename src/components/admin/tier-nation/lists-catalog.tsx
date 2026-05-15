"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmationDialog } from "@/components/shared/confirm-dialog";
import { useDeleteDialogState, useTableState } from "@/components/admin/manager-state";
import { useArchiveTierList, useDeleteTierList } from "@/hooks/use-tn-admin";
import { useTierNationPublicLists } from "@/hooks/use-tn-catalog";
import { CreateListDialog } from "@/components/admin/tier-nation/create-list-dialog";
import type { PublicTierListSummary } from "@/lib/tier-nation/types";
import { toast } from "sonner";
import { Plus, RefreshCw } from "lucide-react";
import {
  createTierNationListColumns,
  sortData,
} from "@/components/admin/tier-nation/catalog-shared";

export function TierNationListsCatalog() {
  const queryClient = useQueryClient();
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => new Set());
  const listTable = useTableState([{ id: "name", desc: false }]);

  const page = listTable.pagination.pageIndex + 1;
  const limit = listTable.pagination.pageSize;

  const listsQuery = useTierNationPublicLists(page, limit);
  const lists = useMemo(() => listsQuery.data?.lists ?? [], [listsQuery.data?.lists]);
  const totalFromApi = listsQuery.data?.total;
  const totalCount =
    totalFromApi != null
      ? totalFromApi
      : lists.length < limit
        ? listTable.pagination.pageIndex * limit + lists.length
        : (listTable.pagination.pageIndex + 2) * limit;

  const { deleteConfirmOpen, setDeleteConfirmOpen, deleteTargetId, requestDelete, clearDelete } =
    useDeleteDialogState<string>();

  const {
    deleteConfirmOpen: hardDeleteOpen,
    setDeleteConfirmOpen: setHardDeleteOpen,
    deleteTargetId: hardDeleteTargetId,
    requestDelete: requestHardDelete,
    clearDelete: clearHardDelete,
  } = useDeleteDialogState<string>();

  const deleteList = useDeleteTierList({
    onSuccess: () => {
      toast.success("List deleted.");
      clearHardDelete();
      queryClient.invalidateQueries({ queryKey: ["tier-nation"] });
    },
    onError: (e) => {
      toast.error(e.message);
      clearHardDelete();
    },
  });

  const archiveList = useArchiveTierList({
    onSuccess: (_data, listId) => {
      toast.success("List archived on server.");
      setArchivedIds((prev) => new Set(prev).add(listId));
      clearDelete();
      queryClient.invalidateQueries({ queryKey: ["tier-nation"] });
    },
    onError: (e) => {
      toast.error(e.message);
      clearDelete();
    },
  });

  const sortedLists = useMemo(
    () =>
      sortData(
        lists as unknown as Record<string, unknown>[],
        listTable.sortBy,
        listTable.sortOrder as "asc" | "desc" | undefined
      ) as PublicTierListSummary[],
    [lists, listTable.sortBy, listTable.sortOrder]
  );

  const listColumns = useMemo(
    () =>
      createTierNationListColumns({
        onArchive: (id) => requestDelete(id),
        onHardDelete: (id) => requestHardDelete(id),
        archivingId: archiveList.isPending ? deleteTargetId : null,
        hardDeletingId: deleteList.isPending ? hardDeleteTargetId : null,
        archivedIds,
      }),
    [
      requestDelete,
      requestHardDelete,
      archiveList.isPending,
      deleteTargetId,
      deleteList.isPending,
      hardDeleteTargetId,
      archivedIds,
    ]
  );

  const invalidateLists = () => queryClient.invalidateQueries({ queryKey: ["tier-nation"] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => setListDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New list
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => invalidateLists()}
          disabled={listsQuery.isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${listsQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tier lists</CardTitle>
          <CardDescription>
            Browse and manage Tier Nation lists. Pagination is server-backed and sorting applies to
            the current page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sortedLists}
            columns={listColumns}
            sorting={listTable.sorting}
            onSortingChange={listTable.setSorting}
            pagination={listTable.pagination}
            onPaginationChange={listTable.setPagination}
            totalCount={totalCount}
            isLoading={listsQuery.isLoading}
          />
        </CardContent>
      </Card>

      <CreateListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        onCreated={(_list) => invalidateLists()}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Archive this list?"
        description="Archives on the Tier Nation server (admin API). The public catalog may hide it after refresh."
        confirmText="Archive"
        onConfirm={() => {
          if (deleteTargetId) {
            archiveList.mutate(deleteTargetId);
          }
        }}
        isLoading={archiveList.isPending}
      />

      <ConfirmationDialog
        open={hardDeleteOpen}
        onOpenChange={setHardDeleteOpen}
        title="Delete this list permanently?"
        description="This permanently removes the list and cannot be undone."
        confirmText="Delete permanently"
        onConfirm={() => {
          if (hardDeleteTargetId) {
            deleteList.mutate(hardDeleteTargetId);
          }
        }}
        isLoading={deleteList.isPending}
      />
    </div>
  );
}
