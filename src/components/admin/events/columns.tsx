import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Circuit, Event } from "@/lib/schema";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { createSortableHeader } from "../data-table";

type SportOption = {
  _id: string;
  name: string;
};

type EventsColumnsProps = {
  sports?: SportOption[];
  circuitById: Map<string, Circuit>;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function createEventsColumns({
  sports,
  circuitById,
  onEdit,
  onDelete,
  isDeleting,
}: EventsColumnsProps): ColumnDef<Event>[] {
  return [
    {
      accessorKey: "title",
      header: createSortableHeader("Title"),
      cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
    },
    {
      accessorKey: "round",
      header: createSortableHeader("Round"),
      cell: ({ row }) => <Badge>{row.original.round}</Badge>,
    },
    {
      accessorKey: "type",
      header: createSortableHeader("Type"),
      cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
    },
    {
      accessorKey: "circuit_id",
      header: createSortableHeader("Country"),
      cell: ({ row }) => {
        const circuit = circuitById.get(row.original.circuit_id);
        return <div className="text-xs">{circuit?.country || "Unknown"}</div>;
      },
    },
    {
      accessorKey: "sport_id",
      header: createSortableHeader("Sport"),
      cell: ({ row }) => {
        const sport = sports?.find((s) => s._id === row.original.sport_id);
        return sport?.name || "Unknown";
      },
    },
    {
      accessorKey: "event_start_at",
      header: createSortableHeader("Start Date"),
      cell: ({ row }) => <div className="text-xs">{format(new Date(row.original.event_start_at), "PPp")}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.original._id)} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}
