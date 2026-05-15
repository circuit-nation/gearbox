"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmationDialog } from "@/components/shared/confirm-dialog";
import { useDeleteDialogState, useTableState } from "../manager-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSports } from "@/hooks/use-sports";
import { useDrivers } from "@/hooks/use-drivers";
import { useTeams } from "@/hooks/use-teams";
import {
  PointsUpdateMode,
  useCreateDriverLeaderboard,
  useCreateTeamLeaderboard,
  useDeleteDriverLeaderboard,
  useDeleteTeamLeaderboard,
  useDriverLeaderboard,
  useTeamLeaderboard,
  useUpdateDriverLeaderboard,
  useUpdateDriverPoints,
  useUpdateTeamLeaderboard,
} from "@/hooks/use-leaderboard";
import {
  CreateDriverLeaderboard,
  CreateTeamLeaderboard,
  DriverLeaderboardEntry,
  TeamLeaderboardEntry,
} from "@/lib/circuit-nation/types";
import { createDriverLeaderboardColumns, createTeamLeaderboardColumns } from "./columns";
import { LeaderboardFilters } from "./filters";
import {
  LeaderboardDriverCreateDialog,
  LeaderboardDriverEditDialog,
  LeaderboardPointsDialog,
  LeaderboardTeamCreateDialog,
  LeaderboardTeamEditDialog,
} from "./dialogs";

const currentYear = new Date().getFullYear();

const defaultDriverForm = (year: number): CreateDriverLeaderboard => ({
  year,
  sport_id: "",
  driver_id: "",
  team_id: null,
  stats: { rank: 0, points: 0 },
});

const defaultTeamForm = (year: number): CreateTeamLeaderboard => ({
  year,
  sport_id: "",
  team_id: "",
  stats: { rank: 0, points: 0 },
});

export function LeaderboardManager() {
  const [activeTab, setActiveTab] = useState("drivers");
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterName, setFilterName] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterSport, setFilterSport] = useState("");

  const driversTable = useTableState([{ id: "points", desc: true }]);
  const teamsTable = useTableState([{ id: "totalPoints", desc: true }]);

  const [driverCreateOpen, setDriverCreateOpen] = useState(false);
  const [driverEditOpen, setDriverEditOpen] = useState(false);
  const [editingDriverEntry, setEditingDriverEntry] = useState<DriverLeaderboardEntry | null>(null);
  const [driverFormData, setDriverFormData] = useState<CreateDriverLeaderboard>(
    defaultDriverForm(currentYear)
  );
  const [driverEditFormData, setDriverEditFormData] = useState<Partial<CreateDriverLeaderboard>>(
    {}
  );

  const [teamCreateOpen, setTeamCreateOpen] = useState(false);
  const [teamEditOpen, setTeamEditOpen] = useState(false);
  const [editingTeamEntry, setEditingTeamEntry] = useState<TeamLeaderboardEntry | null>(null);
  const [teamFormData, setTeamFormData] = useState<CreateTeamLeaderboard>(
    defaultTeamForm(currentYear)
  );
  const [teamEditFormData, setTeamEditFormData] = useState<Partial<CreateTeamLeaderboard>>({});

  const { deleteConfirmOpen, setDeleteConfirmOpen, deleteTargetId, requestDelete, clearDelete } =
    useDeleteDialogState<string>();

  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverLeaderboardEntry | null>(null);
  const [pointsMode, setPointsMode] = useState<PointsUpdateMode>("add");
  const [pointsValue, setPointsValue] = useState("");

  const { data: sportsData } = useSports(1, 200, "name", "asc");
  const { data: driversData } = useDrivers(1, 500);
  const { data: teamsData } = useTeams(1, 500);

  const drivers = useDriverLeaderboard(
    driversTable.pagination.pageIndex + 1,
    driversTable.pagination.pageSize,
    driversTable.sortBy,
    driversTable.sortOrder as "asc" | "desc" | undefined,
    filterYear,
    filterName || undefined,
    filterSport || undefined,
    filterTeam || undefined
  );

  const teams = useTeamLeaderboard(
    teamsTable.pagination.pageIndex + 1,
    teamsTable.pagination.pageSize,
    teamsTable.sortBy,
    teamsTable.sortOrder as "asc" | "desc" | undefined,
    filterYear,
    filterSport || undefined,
    filterTeam || undefined
  );

  const createDriverEntry = useCreateDriverLeaderboard({
    onSuccess: () => {
      toast.success("Driver leaderboard entry created!");
      setDriverCreateOpen(false);
      setDriverFormData(defaultDriverForm(filterYear));
    },
    onError: () => toast.error("Unable to create driver entry."),
  });

  const updateDriverEntry = useUpdateDriverLeaderboard({
    onSuccess: () => {
      toast.success("Driver leaderboard entry updated!");
      setDriverEditOpen(false);
      setEditingDriverEntry(null);
      setDriverEditFormData({});
    },
    onError: () => toast.error("Unable to update driver entry."),
  });

  const deleteDriverEntry = useDeleteDriverLeaderboard({
    onSuccess: () => {
      toast.success("Driver leaderboard entry deleted!");
      clearDelete();
    },
    onError: () => {
      toast.error("Unable to delete driver entry.");
      clearDelete();
    },
  });

  const createTeamEntry = useCreateTeamLeaderboard({
    onSuccess: () => {
      toast.success("Team leaderboard entry created!");
      setTeamCreateOpen(false);
      setTeamFormData(defaultTeamForm(filterYear));
    },
    onError: () => toast.error("Unable to create team entry."),
  });

  const updateTeamEntry = useUpdateTeamLeaderboard({
    onSuccess: () => {
      toast.success("Team leaderboard entry updated!");
      setTeamEditOpen(false);
      setEditingTeamEntry(null);
      setTeamEditFormData({});
    },
    onError: () => toast.error("Unable to update team entry."),
  });

  const deleteTeamEntry = useDeleteTeamLeaderboard({
    onSuccess: () => {
      toast.success("Team leaderboard entry deleted!");
      clearDelete();
    },
    onError: () => {
      toast.error("Unable to delete team entry.");
      clearDelete();
    },
  });

  const updateDriverPoints = useUpdateDriverPoints({
    onSuccess: () => {
      toast.success("Points updated successfully!");
      setPointsDialogOpen(false);
      setSelectedDriver(null);
      setPointsMode("add");
      setPointsValue("");
    },
    onError: () => toast.error("Unable to update points. Please try again."),
  });

  const handleManagePoints = (driver: DriverLeaderboardEntry) => {
    setSelectedDriver(driver);
    setPointsMode("add");
    setPointsValue("");
    setPointsDialogOpen(true);
  };

  const handlePointsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDriver) {
      return;
    }

    const parsedValue = Number(pointsValue);

    if (!Number.isFinite(parsedValue)) {
      toast.error("Please enter a valid points value.");
      return;
    }

    updateDriverPoints.mutate({
      id: selectedDriver._id,
      mode: pointsMode,
      value: parsedValue,
    });
  };

  const handleDriverEdit = (entry: DriverLeaderboardEntry) => {
    setEditingDriverEntry(entry);
    setDriverEditFormData({
      year: entry.year,
      sport_id: entry.sport_id,
      driver_id: entry.driver_id,
      team_id: entry.team_id,
      stats: { ...entry.stats },
    });
    setDriverEditOpen(true);
  };

  const handleTeamEdit = (entry: TeamLeaderboardEntry) => {
    setEditingTeamEntry(entry);
    setTeamEditFormData({
      year: entry.year,
      sport_id: entry.sport_id,
      team_id: entry.team_id,
      stats: { ...entry.stats },
    });
    setTeamEditOpen(true);
  };

  const handleDriverCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createDriverEntry.mutate(driverFormData);
  };

  const handleDriverEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingDriverEntry) {
      updateDriverEntry.mutate({ id: editingDriverEntry._id, data: driverEditFormData });
    }
  };

  const handleTeamCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createTeamEntry.mutate(teamFormData);
  };

  const handleTeamEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingTeamEntry) {
      updateTeamEntry.mutate({ id: editingTeamEntry._id, data: teamEditFormData });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) {
      return;
    }

    if (activeTab === "drivers") {
      deleteDriverEntry.mutate(deleteTargetId);
    } else {
      deleteTeamEntry.mutate(deleteTargetId);
    }
  };

  const isDeleting = deleteDriverEntry.isPending || deleteTeamEntry.isPending;

  const driverColumns = useMemo(
    () =>
      createDriverLeaderboardColumns({
        sports: sportsData?.documents,
        onEdit: handleDriverEdit,
        onDelete: requestDelete,
        onManagePoints: handleManagePoints,
        isDeleting: deleteDriverEntry.isPending,
        isUpdatingPoints: updateDriverPoints.isPending,
      }),
    [sportsData, deleteDriverEntry.isPending, updateDriverPoints.isPending, requestDelete]
  );

  const teamColumns = useMemo(
    () =>
      createTeamLeaderboardColumns({
        onEdit: handleTeamEdit,
        onDelete: requestDelete,
        isDeleting: deleteTeamEntry.isPending,
      }),
    [deleteTeamEntry.isPending, requestDelete]
  );

  const driverTableData = useMemo(() => drivers.data?.documents || [], [drivers.data]);
  const teamTableData = useMemo(() => teams.data?.documents || [], [teams.data]);

  return (
    <div className="space-y-4">
      <LeaderboardPointsDialog
        open={pointsDialogOpen}
        onOpenChange={setPointsDialogOpen}
        driver={selectedDriver}
        mode={pointsMode}
        value={pointsValue}
        setMode={setPointsMode}
        setValue={setPointsValue}
        onSubmit={handlePointsSubmit}
        isSubmitting={updateDriverPoints.isPending}
      />

      <LeaderboardDriverEditDialog
        open={driverEditOpen}
        onOpenChange={setDriverEditOpen}
        formData={driverEditFormData}
        setFormData={setDriverEditFormData}
        onSubmit={handleDriverEditSubmit}
        sports={sportsData?.documents}
        drivers={driversData?.documents}
        teams={teamsData?.documents}
        isSubmitting={updateDriverEntry.isPending}
      />

      <LeaderboardTeamEditDialog
        open={teamEditOpen}
        onOpenChange={setTeamEditOpen}
        formData={teamEditFormData}
        setFormData={setTeamEditFormData}
        onSubmit={handleTeamEditSubmit}
        sports={sportsData?.documents}
        teams={teamsData?.documents}
        isSubmitting={updateTeamEntry.isPending}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Leaderboard Entry"
        description="Are you sure you want to delete this leaderboard entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="drivers">Drivers Leaderboard</TabsTrigger>
          <TabsTrigger value="teams">Teams Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="space-y-4">
          <div className="flex justify-end">
            <LeaderboardDriverCreateDialog
              open={driverCreateOpen}
              onOpenChange={setDriverCreateOpen}
              formData={driverFormData}
              setFormData={setDriverFormData}
              onSubmit={handleDriverCreateSubmit}
              sports={sportsData?.documents}
              drivers={driversData?.documents}
              teams={teamsData?.documents}
              isSubmitting={createDriverEntry.isPending}
            />
          </div>

          <DataTable
            data={driverTableData}
            columns={driverColumns}
            sorting={driversTable.sorting}
            onSortingChange={driversTable.setSorting}
            pagination={driversTable.pagination}
            onPaginationChange={driversTable.setPagination}
            totalCount={drivers.data?.total || 0}
            isLoading={drivers.isLoading}
            filterComponent={
              <LeaderboardFilters
                sports={sportsData?.documents}
                teams={teamsData?.documents}
                filterYear={filterYear}
                filterName={filterName}
                filterSport={filterSport}
                filterTeam={filterTeam}
                onFilterYearChange={(value) => {
                  setFilterYear(value);
                  setDriverFormData((prev) => ({ ...prev, year: value }));
                  driversTable.resetPage();
                  teamsTable.resetPage();
                }}
                onFilterSportChange={(value) => {
                  setFilterSport(value);
                  driversTable.resetPage();
                  teamsTable.resetPage();
                }}
                onFilterTeamChange={(value) => {
                  setFilterTeam(value);
                  driversTable.resetPage();
                  teamsTable.resetPage();
                }}
                onFilterNameChange={(value) => {
                  setFilterName(value);
                  driversTable.resetPage();
                }}
                showNameFilter
                showTeamSelect
              />
            }
          />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div className="flex justify-end">
            <LeaderboardTeamCreateDialog
              open={teamCreateOpen}
              onOpenChange={setTeamCreateOpen}
              formData={teamFormData}
              setFormData={setTeamFormData}
              onSubmit={handleTeamCreateSubmit}
              sports={sportsData?.documents}
              teams={teamsData?.documents}
              isSubmitting={createTeamEntry.isPending}
            />
          </div>

          <DataTable
            data={teamTableData}
            columns={teamColumns}
            sorting={teamsTable.sorting}
            onSortingChange={teamsTable.setSorting}
            pagination={teamsTable.pagination}
            onPaginationChange={teamsTable.setPagination}
            totalCount={teams.data?.total || 0}
            isLoading={teams.isLoading}
            filterComponent={
              <LeaderboardFilters
                sports={sportsData?.documents}
                filterYear={filterYear}
                filterSport={filterSport}
                filterTeam={filterTeam}
                onFilterYearChange={(value) => {
                  setFilterYear(value);
                  setTeamFormData((prev) => ({ ...prev, year: value }));
                  driversTable.resetPage();
                  teamsTable.resetPage();
                }}
                onFilterSportChange={(value) => {
                  setFilterSport(value);
                  driversTable.resetPage();
                  teamsTable.resetPage();
                }}
                onFilterTeamChange={(value) => {
                  setFilterTeam(value);
                  driversTable.resetPage();
                  teamsTable.resetPage();
                }}
              />
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
