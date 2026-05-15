import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Unlink } from "lucide-react";
import { ImageValueAvatar } from "@/components/admin/image-value-avatar";
import { Button } from "@/components/ui/button";
import { createSortableHeader } from "@/components/shared/data-table";
import type { PublicTierListEntity } from "@/lib/tier-nation/types";

type ListDetailColumnsOptions = {
  onEdit: (entity: PublicTierListEntity) => void;
  onRemove: (entityId: string) => void;
  pendingEntityId: string | null;
  isRemoving: boolean;
};

export function createListDetailColumns({
  onEdit,
  onRemove,
  pendingEntityId,
  isRemoving,
}: ListDetailColumnsOptions): ColumnDef<PublicTierListEntity>[] {
  return [
    {
      accessorKey: "name",
      header: createSortableHeader("Name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.imageUrl ? (
            <ImageValueAvatar
              value={row.original.imageUrl}
              alt={row.original.name}
              fallback={row.original.name.slice(0, 2).toUpperCase()}
              className="h-8 w-8"
            />
          ) : null}
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "team",
      header: createSortableHeader("Team"),
      cell: ({ row }) => row.original.team || "—",
    },
    {
      accessorKey: "id",
      header: "Id",
      cell: ({ row }) => <code className="text-muted-foreground text-xs">{row.original.id}</code>,
      enableSorting: false,
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.tags?.length ? row.original.tags.join(", ") : "—"}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRemoving && pendingEntityId === row.original.id}
            onClick={() => onRemove(row.original.id)}
            title="Remove from this list"
          >
            <Unlink className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];
}
