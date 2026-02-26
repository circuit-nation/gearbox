import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sport } from "@/lib/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { createSortableHeader } from "../data-table";

type SportsColumnsProps = {
  onEdit: (sport: Sport) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function createSportsColumns({ onEdit, onDelete, isDeleting }: SportsColumnsProps): ColumnDef<Sport>[] {
  return [
    {
      accessorKey: "logo",
      header: "Logo",
      cell: ({ row }) => (
        <img src={row.original.logo} alt={row.original.name} className="h-8 w-8 object-contain" />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Name"),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "type",
      header: createSortableHeader("Type"),
      cell: ({ row }) => row.original.type,
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
