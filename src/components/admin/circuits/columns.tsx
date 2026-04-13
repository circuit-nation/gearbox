import { Button } from "@/components/ui/button";
import { Circuit } from "@/lib/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { createSortableHeader } from "../data-table";

type SportOption = {
  _id: string;
  name: string;
};

type CircuitsColumnsProps = {
  sports?: SportOption[];
  onEdit: (circuit: Circuit) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function createCircuitsColumns({
  sports,
  onEdit,
  onDelete,
  isDeleting,
}: CircuitsColumnsProps): ColumnDef<Circuit>[] {
  return [
    {
      accessorKey: "name",
      header: createSortableHeader("Name"),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "country",
      header: createSortableHeader("Country"),
      cell: ({ row }) => (
        <div className="space-y-1">
          <div>{row.original.country}</div>
        </div>
      ),
    },
    {
      accessorKey: "location_str",
      header: "Location",
      cell: ({ row }) => <div className="text-xs text-muted-foreground">{row.original.location_str}</div>,
      enableSorting: false,
    },
    {
      accessorKey: "sport_id",
      header: "Sport",
      cell: ({ row }) => {
        const sport = sports?.find((s) => s._id === row.original.sport_id);
        return sport?.name || "Unknown";
      },
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
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}
