import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TeamLeaderboardEntry } from "@/lib/schema";
import { ColumnDef } from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";
import { DriverLeaderboardEntry } from "@/hooks/use-leaderboard";
import { createSortableHeader } from "../data-table";

type SportOption = {
  _id: string;
  name: string;
};

type DriverLeaderboardColumnsProps = {
  sports?: SportOption[];
  onManagePoints: (driver: DriverLeaderboardEntry) => void;
  isUpdatingPoints: boolean;
};

export function createDriverLeaderboardColumns({
  sports,
  onManagePoints,
  isUpdatingPoints,
}: DriverLeaderboardColumnsProps): ColumnDef<DriverLeaderboardEntry>[] {
  return [
    {
      accessorKey: "rank",
      header: createSortableHeader("Rank"),
      cell: ({ row }) => <div className="font-semibold">#{row.original.rank}</div>,
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Driver"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={row.original.image} alt={row.original.name} />
            <AvatarFallback>{row.original.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "team",
      header: createSortableHeader("Team"),
      cell: ({ row }) => row.original.team || "Unassigned",
    },
    {
      accessorKey: "sport",
      header: createSortableHeader("Sport"),
      cell: ({ row }) => {
        const sport = sports?.find((item) => item._id === row.original.sport);
        return sport?.name || "Unknown";
      },
    },
    {
      accessorKey: "points",
      header: createSortableHeader("Points"),
      cell: ({ row }) => <div className="font-semibold">{row.original.points ?? 0}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onManagePoints(row.original)}
          disabled={isUpdatingPoints}
        >
          <PlusCircle className="h-4 w-4" />
          Manage Points
        </Button>
      ),
    },
  ];
}

export function createTeamLeaderboardColumns(): ColumnDef<TeamLeaderboardEntry>[] {
  return [
    {
      accessorKey: "rank",
      header: createSortableHeader("Rank"),
      cell: ({ row }) => <div className="font-semibold">#{row.original.rank}</div>,
    },
    {
      accessorKey: "team",
      header: createSortableHeader("Team"),
      cell: ({ row }) => <div className="font-medium">{row.original.team || "Unassigned"}</div>,
    },
    {
      accessorKey: "driverCount",
      header: createSortableHeader("Drivers"),
      cell: ({ row }) => row.original.driverCount,
    },
    {
      accessorKey: "totalPoints",
      header: createSortableHeader("Points"),
      cell: ({ row }) => <div className="font-semibold">{row.original.totalPoints}</div>,
    },
  ];
}
