import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Team } from "@/lib/circuit-nation/types";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { createSortableHeader } from "@/components/shared/data-table";
import { ImageValueAvatar } from "../image-value-avatar";

type SportOption = { _id: string; name: string };

type TeamsColumnsProps = {
  sports?: SportOption[];
  onEdit: (team: Team) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function createTeamsColumns({
  sports,
  onEdit,
  onDelete,
  isDeleting,
}: TeamsColumnsProps): ColumnDef<Team>[] {
  return [
    {
      accessorKey: "logo",
      header: "Logo",
      cell: ({ row }) => (
        <ImageValueAvatar
          value={row.original.logo}
          alt={row.original.name}
          fallback={row.original.name.charAt(0)}
          className="h-8 w-8"
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
      cell: ({ row }) => {
        const sport = sports?.find((item) => item._id === row.original.sport_id);
        return sport?.name || "Unknown";
      },
    },
    {
      accessorKey: "color",
      header: "Color",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded border" style={{ backgroundColor: row.original.color }} />
          <span className="text-xs">{row.original.color}</span>
        </div>
      ),
      enableSorting: false,
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
