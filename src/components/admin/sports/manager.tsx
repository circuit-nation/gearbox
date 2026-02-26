"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSports, useCreateSport, useDeleteSport, useUpdateSport } from "@/hooks/use-sports";
import { toast } from "sonner";
import { CreateSport, Sport } from "@/lib/schema";
import { DataTable } from "../data-table";
import { ConfirmationDialog } from "../confirmation-dialog";
import { useDeleteDialogState, useTableState } from "../manager-state";
import { createSportsColumns } from "./columns";
import { SportsFilters } from "./filters";
import { SportsCreateDialog, SportsEditDialog } from "./dialogs";

export function SportsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteTargetId,
    requestDelete,
    clearDelete,
  } = useDeleteDialogState<string>();
  const { pagination, setPagination, sorting, setSorting, resetPage, sortBy, sortOrder } = useTableState();
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState("");
  const [formData, setFormData] = useState<CreateSport>({
    name: "",
    logo: "",
    color: "#000000",
    type: "formula",
    tags: [],
  });
  const [editFormData, setEditFormData] = useState<Partial<Sport>>({});

  const { data, isLoading } = useSports(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    filterName || undefined,
    filterType || undefined
  );
  const createSport = useCreateSport({
    onSuccess: () => {
      toast.success("Sport created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteSport = useDeleteSport({
    onSuccess: () => {
      toast.success("Sport deleted successfully!");
      clearDelete();
    },
    onError: (error) => {
      toast.error(error.message);
      clearDelete();
    },
  });

  const updateSport = useUpdateSport({
    onSuccess: () => {
      toast.success("Sport updated successfully!");
      setIsEditOpen(false);
      setEditingSport(null);
      setEditFormData({});
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      logo: "",
      color: "#000000",
      type: "formula",
      tags: [],
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createSport.mutate(formData);
  };

  const handleEdit = (sport: Sport) => {
    setEditingSport(sport);
    setEditFormData({
      name: sport.name,
      logo: sport.logo,
      color: sport.color,
      type: sport.type,
      tags: sport.tags,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingSport) {
      updateSport.mutate({ id: editingSport.convexId, data: editFormData });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteSport.mutate(deleteTargetId);
    }
  };

  const columns = useMemo(
    () =>
      createSportsColumns({
        onEdit: handleEdit,
        onDelete: requestDelete,
        isDeleting: deleteSport.isPending,
      }),
    [deleteSport.isPending, requestDelete]
  );

  const tableData = useMemo(() => data?.documents || [], [data]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SportsCreateDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isSubmitting={createSport.isPending}
        />
      </div>

      <SportsEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleEditSubmit}
        isSubmitting={updateSport.isPending}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Sport"
        description="Are you sure you want to delete this sport? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteSport.isPending}
      />

      <DataTable
        data={tableData}
        columns={columns}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalCount={data?.total || 0}
        isLoading={isLoading}
        filterComponent={
          <SportsFilters
            filterName={filterName}
            filterType={filterType}
            onFilterNameChange={(value) => {
              setFilterName(value);
              resetPage();
            }}
            onFilterTypeChange={(value) => {
              setFilterType(value);
              resetPage();
            }}
          />
        }
      />
    </div>
  );
}
