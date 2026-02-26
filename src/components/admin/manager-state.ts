"use client";

import { useState } from "react";
import { SortingState } from "@tanstack/react-table";

export const DEFAULT_PAGINATION = {
  pageIndex: 0,
  pageSize: 10,
};

export function useTableState(initialSorting: SortingState = []) {
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

  return {
    pagination,
    setPagination,
    sorting,
    setSorting,
    resetPage,
    sortBy,
    sortOrder,
  };
}

export function useDeleteDialogState<T extends string>() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<T | null>(null);

  const requestDelete = (id: T) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const clearDelete = () => {
    setDeleteTargetId(null);
    setDeleteConfirmOpen(false);
  };

  return {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteTargetId,
    requestDelete,
    clearDelete,
  };
}
