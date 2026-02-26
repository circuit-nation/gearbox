import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Circuit } from "@/lib/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { createSortableHeader } from "../data-table";

type SportOption = {
  convexId: string;
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
          <Badge variant="secondary" className="text-[10px]">
            {row.original.country_code}
          </Badge>
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
        const sport = sports?.find((s) => s.convexId === row.original.sport_id);
        return sport?.name || "Unknown";
      },
    },
    {
      accessorKey: "length_km",
      header: createSortableHeader("Length (km)"),
      cell: ({ row }) => (
        <div className="text-xs">{row.original.length_km ? row.original.length_km.toFixed(2) : "-"}</div>
      ),
    },
    {
      accessorKey: "track_type",
      header: "Track Type",
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize">
          {row.original.track_type || "n/a"}
        </Badge>
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
            onClick={() => onDelete(row.original.convexId)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}
