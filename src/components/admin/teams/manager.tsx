"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  useCreateTeam,
  useDeleteTeam,
  useSports,
  useTeams,
  useUpdateTeam,
} from "@/hooks/use-teams";
import { toast } from "sonner";
import { CreateTeam, Team } from "@/lib/circuit-nation/types";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmationDialog } from "@/components/shared/confirm-dialog";
import { useDeleteDialogState, useTableState } from "../manager-state";
import { createTeamsColumns } from "./columns";
import { TeamsFilters } from "./filters";
import { TeamsCreateDialog, TeamsEditDialog } from "./dialogs";

export function TeamsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const { deleteConfirmOpen, setDeleteConfirmOpen, deleteTargetId, requestDelete, clearDelete } =
    useDeleteDialogState<string>();
  const { pagination, setPagination, sorting, setSorting, resetPage, sortBy, sortOrder } =
    useTableState();
  const [filterName, setFilterName] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [formData, setFormData] = useState<CreateTeam>({
    name: "",
    logo: "",
    color: "#000000",
    sport_id: "",
    tags: [],
  });
  const [editFormData, setEditFormData] = useState<Partial<Team>>({});

  const { data, isLoading } = useTeams(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    filterName || undefined,
    filterSport || undefined
  );
  const { data: sportsData } = useSports(1, 100);

  const createTeam = useCreateTeam({
    onSuccess: () => {
      toast.success("Team created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error("Unable to create team. Please try again."),
  });

  const deleteTeam = useDeleteTeam({
    onSuccess: () => {
      toast.success("Team deleted successfully!");
      clearDelete();
    },
    onError: () => {
      toast.error("Unable to delete team. Please try again.");
      clearDelete();
    },
  });

  const updateTeam = useUpdateTeam({
    onSuccess: () => {
      toast.success("Team updated successfully!");
      setIsEditOpen(false);
      setEditingTeam(null);
      setEditFormData({});
    },
    onError: () => toast.error("Unable to update team. Please try again."),
  });

  const resetForm = () => {
    setFormData({ name: "", logo: "", color: "#000000", sport_id: "", tags: [] });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createTeam.mutate({ ...formData, logo: formData.logo.trim() });
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setEditFormData({
      name: team.name,
      logo: team.logo,
      color: team.color,
      sport_id: team.sport_id,
      tags: team.tags,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingTeam) {
      updateTeam.mutate({
        id: editingTeam._id,
        data: { ...editFormData, logo: editFormData.logo?.trim() },
      });
    }
  };

  const columns = useMemo(
    () =>
      createTeamsColumns({
        sports: sportsData?.documents,
        onEdit: handleEdit,
        onDelete: requestDelete,
        isDeleting: deleteTeam.isPending,
      }),
    [sportsData, deleteTeam.isPending, requestDelete]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TeamsCreateDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          sports={sportsData?.documents}
          isSubmitting={createTeam.isPending}
        />
      </div>

      <TeamsEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleEditSubmit}
        sports={sportsData?.documents}
        isSubmitting={updateTeam.isPending}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => deleteTargetId && deleteTeam.mutate(deleteTargetId)}
        title="Delete Team"
        description="Are you sure you want to delete this team? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteTeam.isPending}
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
          <TeamsFilters
            filterName={filterName}
            filterSport={filterSport}
            sports={sportsData?.documents}
            onFilterNameChange={(value) => {
              setFilterName(value);
              resetPage();
            }}
            onFilterSportChange={(value) => {
              setFilterSport(value);
              resetPage();
            }}
          />
        }
      />
    </div>
  );
}
