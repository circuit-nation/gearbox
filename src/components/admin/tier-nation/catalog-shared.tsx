"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ImageValueAvatar } from "@/components/admin/image-value-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSortableHeader } from "@/components/shared/data-table";
import type { CatalogEntityRow } from "@/hooks/use-tn-catalog";
import type { PublicTierListSummary } from "@/lib/tier-nation/types";
import { format } from "date-fns";
import { Archive, ExternalLink, Pencil, Trash2 } from "lucide-react";

export function compareCell(a: unknown, b: unknown) {
  const sa = a == null ? "" : String(a);
  const sb = b == null ? "" : String(b);
  return sa.localeCompare(sb);
}

export function sortData<T extends Record<string, unknown>>(
  rows: T[],
  sortBy: string | undefined,
  sortOrder: "asc" | "desc" | undefined
) {
  if (!sortBy) return rows;
  const mult = sortOrder === "asc" ? 1 : -1;
  return [...rows].sort((x, y) => mult * compareCell(x[sortBy], y[sortBy]));
}

export function paginate<T>(rows: T[], pageIndex: number, pageSize: number) {
  const start = pageIndex * pageSize;
  return rows.slice(start, start + pageSize);
}

export function createTierNationListColumns(options: {
  onArchive: (id: string) => void;
  onHardDelete?: (id: string) => void;
  archivingId: string | null;
  hardDeletingId?: string | null;
  archivedIds: Set<string>;
}): ColumnDef<PublicTierListSummary>[] {
  return [
    {
      id: "cover",
      header: "",
      cell: ({ row }) =>
        row.original.coverImage?.trim() ? (
          <ImageValueAvatar
            value={row.original.coverImage.trim()}
            alt=""
            fallback="?"
            className="h-9 w-9 rounded-md"
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Name"),
      cell: ({ row }) => (
        <div className="font-medium">
          <Link
            href={`/tier-nation/lists/${row.original.id}`}
            className="text-primary hover:underline"
          >
            {row.original.name}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "id",
      header: createSortableHeader("UUID"),
      cell: ({ row }) => <code className="text-muted-foreground text-xs">{row.original.id}</code>,
    },
    {
      accessorKey: "isVisible",
      header: createSortableHeader("Visible"),
      cell: ({ row }) => (
        <Badge variant={row.original.isVisible ? "secondary" : "outline"}>
          {row.original.isVisible ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: createSortableHeader("Created"),
      cell: ({ row }) =>
        row.original.createdAt ? (
          <span className="text-muted-foreground text-sm">
            {format(new Date(row.original.createdAt), "PPp")}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tier-nation/lists/${row.original.id}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={
              options.archivedIds.has(row.original.id) || options.archivingId === row.original.id
            }
            onClick={() => options.onArchive(row.original.id)}
          >
            <Archive className="h-4 w-4" />
          </Button>
          {options.onHardDelete ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={
                options.archivedIds.has(row.original.id) ||
                options.hardDeletingId === row.original.id
              }
              onClick={() => options.onHardDelete?.(row.original.id)}
              title="Delete permanently"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ),
      enableSorting: false,
    },
  ];
}

export function createTierNationEntityColumns(options?: {
  onEdit?: (row: CatalogEntityRow) => void;
  onDelete?: (row: CatalogEntityRow) => void;
  pendingEntityId?: string | null;
}): ColumnDef<CatalogEntityRow>[] {
  return [
    {
      id: "image",
      header: "",
      cell: ({ row }) =>
        row.original.imageUrl?.trim() ? (
          <ImageValueAvatar
            value={row.original.imageUrl.trim()}
            alt={row.original.name}
            fallback={row.original.name.slice(0, 2).toUpperCase()}
            className="h-9 w-9 rounded-md"
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Name"),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "team",
      header: createSortableHeader("Team"),
      cell: ({ row }) => row.original.team || "—",
    },
    {
      accessorKey: "listName",
      header: createSortableHeader("List"),
      cell: ({ row }) => (
        <Link
          href={`/tier-nation/lists/${row.original.listId}`}
          className="text-primary text-sm hover:underline"
        >
          {row.original.listName}
        </Link>
      ),
    },
    {
      accessorKey: "id",
      header: "Entity id",
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
    ...(options?.onEdit || options?.onDelete
      ? [
          {
            id: "entity-actions",
            header: "",
            cell: ({ row }) => (
              <div className="flex justify-end gap-2">
                {options?.onEdit ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={options.pendingEntityId === row.original.id}
                    onClick={() => options.onEdit?.(row.original)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : null}
                {options?.onDelete ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={options.pendingEntityId === row.original.id}
                    onClick={() => options.onDelete?.(row.original)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ),
            enableSorting: false,
          } satisfies ColumnDef<CatalogEntityRow>,
        ]
      : []),
  ];
}
