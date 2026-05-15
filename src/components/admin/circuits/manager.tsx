"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  useCircuits,
  useCreateCircuit,
  useDeleteCircuit,
  useSports,
  useUpdateCircuit,
} from "@/hooks/use-circuits";
import { toast } from "sonner";
import { Circuit, CreateCircuit } from "@/lib/circuit-nation/types";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmationDialog } from "@/components/shared/confirm-dialog";
import { useDeleteDialogState, useTableState } from "../manager-state";
import { createCircuitsColumns } from "./columns";
import { CircuitsFilters } from "./filters";
import { CircuitsCreateDialog, CircuitsEditDialog } from "./dialogs";

export function CircuitsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);
  const { deleteConfirmOpen, setDeleteConfirmOpen, deleteTargetId, requestDelete, clearDelete } =
    useDeleteDialogState<string>();
  const { pagination, setPagination, sorting, setSorting, resetPage, sortBy, sortOrder } =
    useTableState();
  const [filterName, setFilterName] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [formData, setFormData] = useState<CreateCircuit>({
    name: "",
    location_str: "",
    country: "",
    country_code: "",
    location: { latitude: 0, longitude: 0 },
    image: "",
    sport_id: "",
    tags: [],
  });
  const [editFormData, setEditFormData] = useState<Partial<Circuit>>({});

  const { data, isLoading } = useCircuits(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    filterName || undefined,
    filterSport || undefined,
    filterCountry || undefined
  );
  const { data: sportsData } = useSports(1, 100);

  const createCircuit = useCreateCircuit({
    onSuccess: () => {
      toast.success("Circuit created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error("Unable to create circuit. Please try again."),
  });

  const deleteCircuit = useDeleteCircuit({
    onSuccess: () => {
      toast.success("Circuit deleted successfully!");
      clearDelete();
    },
    onError: () => {
      toast.error("Unable to delete circuit. Please try again.");
      clearDelete();
    },
  });

  const updateCircuit = useUpdateCircuit({
    onSuccess: () => {
      toast.success("Circuit updated successfully!");
      setIsEditOpen(false);
      setEditingCircuit(null);
      setEditFormData({});
    },
    onError: () => toast.error("Unable to update circuit. Please try again."),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      location_str: "",
      country: "",
      country_code: "",
      location: { latitude: 0, longitude: 0 },
      image: "",
      sport_id: "",
      tags: [],
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createCircuit.mutate(formData);
  };

  const handleEdit = (circuit: Circuit) => {
    setEditingCircuit(circuit);
    setEditFormData({
      name: circuit.name,
      location_str: circuit.location_str,
      country: circuit.country,
      country_code: circuit.country_code,
      location: {
        latitude: circuit.location.latitude,
        longitude: circuit.location.longitude,
      },
      image: circuit.image,
      sport_id: circuit.sport_id,
      tags: circuit.tags,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingCircuit) {
      updateCircuit.mutate({ id: editingCircuit._id, data: editFormData });
    }
  };

  const columns = useMemo(
    () =>
      createCircuitsColumns({
        sports: sportsData?.documents,
        onEdit: handleEdit,
        onDelete: requestDelete,
        isDeleting: deleteCircuit.isPending,
      }),
    [sportsData, deleteCircuit.isPending, requestDelete]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CircuitsCreateDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          sports={sportsData?.documents}
          isSubmitting={createCircuit.isPending}
        />
      </div>

      <CircuitsEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleEditSubmit}
        sports={sportsData?.documents}
        isSubmitting={updateCircuit.isPending}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => deleteTargetId && deleteCircuit.mutate(deleteTargetId)}
        title="Delete Circuit"
        description="Are you sure you want to delete this circuit? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteCircuit.isPending}
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
          <CircuitsFilters
            filterName={filterName}
            filterCountry={filterCountry}
            filterSport={filterSport}
            sports={sportsData?.documents}
            onFilterNameChange={(value) => {
              setFilterName(value);
              resetPage();
            }}
            onFilterCountryChange={(value) => {
              setFilterCountry(value);
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
