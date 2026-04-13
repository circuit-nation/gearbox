import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Driver } from "@/lib/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { createSortableHeader } from "../data-table";

type SportOption = {
  _id: string;
  name: string;
};

type DriversColumnsProps = {
  sports?: SportOption[];
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function createDriversColumns({
  sports,
  onEdit,
  onDelete,
  isDeleting,
}: DriversColumnsProps): ColumnDef<Driver>[] {
  return [
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => (
        <Avatar>
          <AvatarImage src={row.original.image} alt={row.original.name} />
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
        const sport = sports?.find((s) => s._id === row.original.sport);
        return sport?.name || "Unknown";
      },
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
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.original._id)} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}
