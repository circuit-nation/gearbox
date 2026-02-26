import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Team } from "@/lib/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { createSortableHeader } from "../data-table";

type SportOption = {
  convexId: string;
  name: string;
};

type TeamsColumnsProps = {
  sports?: SportOption[];
  onEdit: (team: Team) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function createTeamsColumns({ sports, onEdit, onDelete, isDeleting }: TeamsColumnsProps): ColumnDef<Team>[] {
  return [
    {
      accessorKey: "logo",
      header: "Logo",
      cell: ({ row }) => (
        <Avatar>
          <AvatarImage src={row.original.logo} alt={row.original.name} />
          <AvatarFallback>{row.original.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Name"),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "sport",
      header: createSortableHeader("Sport"),
      cell: ({ row }) => {
        const sport = sports?.find((s) => s.convexId === row.original.sport);
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
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.original.convexId)} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}
