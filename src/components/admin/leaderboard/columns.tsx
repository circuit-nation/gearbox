import { Button } from "@/components/ui/button";
import { DriverLeaderboardEntry, TeamLeaderboardEntry } from "@/lib/circuit-nation/types";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { createSortableHeader } from "@/components/shared/data-table";
import { ImageValueAvatar } from "../image-value-avatar";

type SportOption = {
  _id: string;
  name: string;
};

type DriverLeaderboardColumnsProps = {
  sports?: SportOption[];
  onEdit: (entry: DriverLeaderboardEntry) => void;
  onDelete: (id: string) => void;
  onManagePoints: (driver: DriverLeaderboardEntry) => void;
  isDeleting: boolean;
  isUpdatingPoints: boolean;
};

type TeamLeaderboardColumnsProps = {
  onEdit: (entry: TeamLeaderboardEntry) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function createDriverLeaderboardColumns({
  sports,
  onEdit,
  onDelete,
  onManagePoints,
  isDeleting,
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
          <ImageValueAvatar
            value={row.original.image}
            alt={row.original.name}
            fallback={row.original.name.substring(0, 2).toUpperCase()}
          />
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
      accessorKey: "sport_id",
      header: createSortableHeader("Sport"),
      cell: ({ row }) => {
        const sport = sports?.find((item) => item._id === row.original.sport_id);
        return sport?.name || "Unknown";
      },
    },
    {
      accessorKey: "points",
      header: createSortableHeader("Points"),
      cell: ({ row }) => (
        <div className="font-semibold">
          {row.original.stats?.points ?? row.original.points ?? 0}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onManagePoints(row.original)}
            disabled={isUpdatingPoints}
          >
            <PlusCircle className="h-4 w-4" />
            Points
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original._id)}
            disabled={isDeleting}
          >
            <Trash2 className="text-destructive h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}

export function createTeamLeaderboardColumns({
  onEdit,
  onDelete,
  isDeleting,
}: TeamLeaderboardColumnsProps): ColumnDef<TeamLeaderboardEntry>[] {
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
      cell: ({ row }) => (
        <div className="font-semibold">
          {row.original.stats?.points ?? row.original.totalPoints ?? 0}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original._id)}
            disabled={isDeleting}
          >
            <Trash2 className="text-destructive h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
