"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useCircuits, useCreateCircuit, useDeleteCircuit, useUpdateCircuit } from "@/hooks/use-circuits";
import { useSports } from "@/hooks/use-sports";
import { toast } from "sonner";
import { Circuit, CreateCircuit } from "@/lib/schema";
import { DataTable } from "../data-table";
import { ConfirmationDialog } from "../confirmation-dialog";
import { useDeleteDialogState, useTableState } from "../manager-state";
import { createCircuitsColumns } from "./columns";
import { CircuitsFilters } from "./filters";
import { CircuitsCreateDialog, CircuitsEditDialog } from "./dialogs";

export function CircuitsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);
  const {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteTargetId,
    requestDelete,
    clearDelete,
  } = useDeleteDialogState<string>();
  const { pagination, setPagination, sorting, setSorting, resetPage, sortBy, sortOrder } = useTableState();
  const [filterName, setFilterName] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [formData, setFormData] = useState<CreateCircuit>({
    id: "",
    name: "",
    location_str: "",
    country: "",
    country_code: "",
    sport_id: "",
    image: "",
    logo: "",
    color: "",
    length_km: undefined,
    turns: undefined,
    laps: undefined,
    lap_record: "",
    lap_record_holder: "",
    lap_record_year: undefined,
    track_type: undefined,
    direction: undefined,
    year_opened: undefined,
    tags: [],
    official_website: "",
  });
  const [editFormData, setEditFormData] = useState<Partial<Circuit>>({});

  const { data, isLoading } = useCircuits(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    filterName || undefined,
    filterCountry || undefined,
    filterSport || undefined
  );
  const { data: sportsData } = useSports(1, 100);

  const createCircuit = useCreateCircuit({
    onSuccess: () => {
      toast.success("Circuit created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteCircuit = useDeleteCircuit({
    onSuccess: () => {
      toast.success("Circuit deleted successfully!");
      clearDelete();
    },
    onError: (error) => {
      toast.error(error.message);
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
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      location_str: "",
      country: "",
      country_code: "",
      sport_id: "",
      image: "",
      logo: "",
      color: "",
      length_km: undefined,
      turns: undefined,
      laps: undefined,
      lap_record: "",
      lap_record_holder: "",
      lap_record_year: undefined,
      track_type: undefined,
      direction: undefined,
      year_opened: undefined,
      tags: [],
      official_website: "",
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createCircuit.mutate({
      ...formData,
      image: formData.image?.trim() || undefined,
      logo: formData.logo?.trim() || undefined,
      color: formData.color?.trim() || undefined,
      lap_record: formData.lap_record?.trim() || undefined,
      lap_record_holder: formData.lap_record_holder?.trim() || undefined,
      official_website: formData.official_website?.trim() || undefined,
    });
  };

  const handleEdit = (circuit: Circuit) => {
    setEditingCircuit(circuit);
    setEditFormData({
      id: circuit.id,
      name: circuit.name,
      location_str: circuit.location_str,
      country: circuit.country,
      country_code: circuit.country_code,
      sport_id: circuit.sport_id,
      image: circuit.image,
      logo: circuit.logo,
      color: circuit.color,
      length_km: circuit.length_km,
      turns: circuit.turns,
      laps: circuit.laps,
      lap_record: circuit.lap_record,
      lap_record_holder: circuit.lap_record_holder,
      lap_record_year: circuit.lap_record_year,
      track_type: circuit.track_type,
      direction: circuit.direction,
      year_opened: circuit.year_opened,
      tags: circuit.tags,
      official_website: circuit.official_website,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingCircuit) {
      updateCircuit.mutate({
        id: editingCircuit._id,
        data: {
          ...editFormData,
          image: editFormData.image?.trim() || undefined,
          logo: editFormData.logo?.trim() || undefined,
          color: editFormData.color?.trim() || undefined,
          lap_record: editFormData.lap_record?.trim() || undefined,
          lap_record_holder: editFormData.lap_record_holder?.trim() || undefined,
          official_website: editFormData.official_website?.trim() || undefined,
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteCircuit.mutate(deleteTargetId);
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

  const tableData = useMemo(() => data?.documents || [], [data]);

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
        onConfirm={handleDeleteConfirm}
        title="Delete Circuit"
        description="Are you sure you want to delete this circuit? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteCircuit.isPending}
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
          <CircuitsFilters
            filterName={filterName}
            filterCountry={filterCountry}
            filterSport={filterSport}
            onFilterNameChange={(value) => {
              setFilterName(value);
              resetPage();
            }}
            onFilterCountryChange={(value) => {
              setFilterCountry(value);
              resetPage();
            }}
            onFilterSportChange={(value) => {
              setFilterSport(value === "all" ? "" : value);
              resetPage();
            }}
            sports={sportsData?.documents}
          />
        }
      />
    </div>
  );
}
