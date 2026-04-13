"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useTeams, useCreateTeam, useDeleteTeam, useUpdateTeam } from "@/hooks/use-teams";
import { useSports } from "@/hooks/use-sports";
import { toast } from "sonner";
import { CreateTeam, Team } from "@/lib/schema";
import { DataTable } from "../data-table";
import { ConfirmationDialog } from "../confirmation-dialog";
import { useDeleteDialogState, useTableState } from "../manager-state";
import { createTeamsColumns } from "./columns";
import { TeamsFilters } from "./filters";
import { TeamsCreateDialog, TeamsEditDialog } from "./dialogs";

export function TeamsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteTargetId,
    requestDelete,
    clearDelete,
  } = useDeleteDialogState<string>();
  const { pagination, setPagination, sorting, setSorting, resetPage, sortBy, sortOrder } = useTableState();
  const [filterName, setFilterName] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [formData, setFormData] = useState<CreateTeam>({
    id: "",
    name: "",
    logo: "",
    sport: "",
    tags: [],
    color: "#000000",
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
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeam = useDeleteTeam({
    onSuccess: () => {
      toast.success("Team deleted successfully!");
      clearDelete();
    },
    onError: (error) => {
      toast.error(error.message);
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
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      logo: "",
      sport: "",
      tags: [],
      color: "#000000",
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createTeam.mutate(formData);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setEditFormData({
      name: team.name,
      logo: team.logo,
      sport: team.sport,
      tags: team.tags,
      color: team.color,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingTeam) {
      updateTeam.mutate({ id: editingTeam._id, data: editFormData });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteTeam.mutate(deleteTargetId);
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

  const tableData = useMemo(() => data?.documents || [], [data]);

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
        onConfirm={handleDeleteConfirm}
        title="Delete Team"
        description="Are you sure you want to delete this team? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteTeam.isPending}
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
          <TeamsFilters
            filterName={filterName}
            filterSport={filterSport}
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
