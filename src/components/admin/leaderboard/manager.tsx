"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DataTable } from "../data-table";
import { useTableState } from "../manager-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSports } from "@/hooks/use-sports";
import {
  DriverLeaderboardEntry,
  PointsUpdateMode,
  useDriverLeaderboard,
  useTeamLeaderboard,
  useUpdateDriverPoints,
} from "@/hooks/use-leaderboard";
import { createDriverLeaderboardColumns, createTeamLeaderboardColumns } from "./columns";
import { LeaderboardFilters } from "./filters";
import { LeaderboardPointsDialog } from "./dialogs";

export function LeaderboardManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("drivers");

  const driversTable = useTableState([{ id: "points", desc: true }]);
  const teamsTable = useTableState([{ id: "totalPoints", desc: true }]);

  const [filterName, setFilterName] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterSport, setFilterSport] = useState("");

  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverLeaderboardEntry | null>(null);
  const [pointsMode, setPointsMode] = useState<PointsUpdateMode>("add");
  const [pointsValue, setPointsValue] = useState("");

  const { data: sportsData } = useSports(1, 200, "name", "asc");

  const drivers = useDriverLeaderboard(
    driversTable.pagination.pageIndex + 1,
    driversTable.pagination.pageSize,
    driversTable.sortBy,
    driversTable.sortOrder as "asc" | "desc" | undefined,
    filterName || undefined,
    filterSport || undefined,
    filterTeam || undefined
  );

  const teams = useTeamLeaderboard(
    teamsTable.pagination.pageIndex + 1,
    teamsTable.pagination.pageSize,
    teamsTable.sortBy,
    teamsTable.sortOrder as "asc" | "desc" | undefined,
    filterSport || undefined,
    filterTeam || undefined
  );

  const updateDriverPoints = useUpdateDriverPoints({
    onSuccess: () => {
      toast.success("Points updated successfully!");
      setPointsDialogOpen(false);
      setSelectedDriver(null);
      setPointsMode("add");
      setPointsValue("");
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
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

  const driverColumns = useMemo(
    () =>
      createDriverLeaderboardColumns({
        sports: sportsData?.documents,
        onManagePoints: handleManagePoints,
        isUpdatingPoints: updateDriverPoints.isPending,
      }),
    [sportsData, updateDriverPoints.isPending]
  );

  const teamColumns = useMemo(() => createTeamLeaderboardColumns(), []);

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="drivers">Drivers Leaderboard</TabsTrigger>
          <TabsTrigger value="teams">Teams Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="space-y-4">
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
                filterName={filterName}
                filterSport={filterSport}
                filterTeam={filterTeam}
                onFilterNameChange={(value) => {
                  setFilterName(value);
                  driversTable.resetPage();
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
                showNameFilter
              />
            }
          />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
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
                filterSport={filterSport}
                filterTeam={filterTeam}
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
