"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useDrivers, useCreateDriver, useDeleteDriver, useUpdateDriver } from "@/hooks/use-drivers";
import { useSports } from "@/hooks/use-sports";
import { useTeams } from "@/hooks/use-teams";
import { toast } from "sonner";
import { CreateDriver, Driver } from "@/lib/circuit-nation/types";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmationDialog } from "@/components/shared/confirm-dialog";
import { useDeleteDialogState, useTableState } from "../manager-state";
import { createDriversColumns } from "./columns";
import { DriversFilters } from "./filters";
import { DriversCreateDialog, DriversEditDialog } from "./dialogs";

export function DriversManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const { deleteConfirmOpen, setDeleteConfirmOpen, deleteTargetId, requestDelete, clearDelete } =
    useDeleteDialogState<string>();
  const { pagination, setPagination, sorting, setSorting, resetPage, sortBy, sortOrder } =
    useTableState();
  const [filterName, setFilterName] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [formData, setFormData] = useState<CreateDriver>({
    name: "",
    image: "",
    sport_id: "",
    team_id: null,
    tags: [],
  });
  const [editFormData, setEditFormData] = useState<Partial<Driver>>({});

  const { data, isLoading } = useDrivers(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    filterName || undefined,
    filterSport || undefined,
    filterTeam || undefined
  );
  const { data: sportsData } = useSports(1, 100);
  const { data: teamsData } = useTeams(1, 200);

  const createDriver = useCreateDriver({
    onSuccess: () => {
      toast.success("Driver created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error("Unable to create driver. Please try again."),
  });

  const deleteDriver = useDeleteDriver({
    onSuccess: () => {
      toast.success("Driver deleted successfully!");
      clearDelete();
    },
    onError: () => {
      toast.error("Unable to delete driver. Please try again.");
      clearDelete();
    },
  });

  const updateDriver = useUpdateDriver({
    onSuccess: () => {
      toast.success("Driver updated successfully!");
      setIsEditOpen(false);
      setEditingDriver(null);
      setEditFormData({});
    },
    onError: () => toast.error("Unable to update driver. Please try again."),
  });

  const resetForm = () => {
    setFormData({ name: "", image: "", sport_id: "", team_id: null, tags: [] });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createDriver.mutate({ ...formData, image: formData.image.trim() });
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setEditFormData({
      name: driver.name,
      image: driver.image,
      sport_id: driver.sport_id,
      team_id: driver.team_id,
      tags: driver.tags,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingDriver) {
      updateDriver.mutate({
        id: editingDriver._id,
        data: { ...editFormData, image: editFormData.image?.trim() },
      });
    }
  };

  const columns = useMemo(
    () =>
      createDriversColumns({
        sports: sportsData?.documents,
        teams: teamsData?.documents,
        onEdit: handleEdit,
        onDelete: requestDelete,
        isDeleting: deleteDriver.isPending,
      }),
    [sportsData, teamsData, deleteDriver.isPending, requestDelete]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DriversCreateDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          sports={sportsData?.documents}
          teams={teamsData?.documents}
          isSubmitting={createDriver.isPending}
        />
      </div>

      <DriversEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleEditSubmit}
        sports={sportsData?.documents}
        teams={teamsData?.documents}
        isSubmitting={updateDriver.isPending}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => deleteTargetId && deleteDriver.mutate(deleteTargetId)}
        title="Delete Driver"
        description="Are you sure you want to delete this driver? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteDriver.isPending}
      />

      <DataTable
        data={data?.documents || []}
        columns={columns}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalCount={data?.total || 0}
        isLoading={isLoading}
        filterComponent={
          <DriversFilters
            filterName={filterName}
            filterSport={filterSport}
            filterTeam={filterTeam}
            sports={sportsData?.documents}
            teams={teamsData?.documents}
            onFilterNameChange={(value) => {
              setFilterName(value);
              resetPage();
            }}
            onFilterSportChange={(value) => {
              setFilterSport(value);
              setFilterTeam("");
              resetPage();
            }}
            onFilterTeamChange={(value) => {
              setFilterTeam(value);
              resetPage();
            }}
          />
        }
      />
    </div>
  );
}
