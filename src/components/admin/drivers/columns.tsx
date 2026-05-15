import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Driver } from "@/lib/circuit-nation/types";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { createSortableHeader } from "@/components/shared/data-table";
import { ImageValueAvatar } from "../image-value-avatar";

type SportOption = { _id: string; name: string };
type TeamOption = { _id: string; name: string };

type DriversColumnsProps = {
  sports?: SportOption[];
  teams?: TeamOption[];
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function createDriversColumns({
  sports,
  teams,
  onEdit,
  onDelete,
  isDeleting,
}: DriversColumnsProps): ColumnDef<Driver>[] {
  return [
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => (
        <ImageValueAvatar
          value={row.original.image}
          alt={row.original.name}
          fallback={row.original.name.substring(0, 2).toUpperCase()}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Name"),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "sport_id",
      header: createSortableHeader("Sport"),
      cell: ({ row }) => sports?.find((s) => s._id === row.original.sport_id)?.name || "Unknown",
    },
    {
      accessorKey: "team_id",
      header: createSortableHeader("Team"),
      cell: ({ row }) => {
        if (!row.original.team_id) return "Unassigned";
        return teams?.find((t) => t._id === row.original.team_id)?.name || "Unknown";
      },
    },
    {
      accessorKey: "points",
      header: createSortableHeader("Points"),
      cell: ({ row }) => <div className="font-medium">{row.original.points ?? 0}</div>,
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.tags?.map((tag, idx) => (
            <Badge key={idx} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "actions",
      header: "Actions",
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
