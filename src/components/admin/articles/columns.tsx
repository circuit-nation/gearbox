import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { createSortableHeader } from "@/components/shared/data-table";
import type { Article } from "@/app/api/articles/route";

type ArticlesColumnsProps = {
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  isUpdating: boolean;
};

export function createArticlesColumns({
  onPublish,
  onUnpublish,
  isUpdating,
}: ArticlesColumnsProps): ColumnDef<Article>[] {
  return [
    {
      accessorKey: "title",
      header: createSortableHeader("Title"),
      cell: ({ row }) => (
        <div className="max-w-md">
          <div className="font-medium line-clamp-1">{row.original.title}</div>
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 text-xs"
          >
            View article
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ),
    },
    {
      accessorKey: "publishedAt",
      header: createSortableHeader("Published"),
      cell: ({ row }) => (
        <div className="text-xs">{format(new Date(row.original.publishedAt), "PPp")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: createSortableHeader("Status"),
      cell: ({ row }) => (
        <Badge variant={row.original.status === "published" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "syncedAt",
      header: createSortableHeader("Last synced"),
      cell: ({ row }) => (
        <div className="text-xs">{format(new Date(row.original.syncedAt), "PPp")}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.status === "draft" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPublish(row.original._id)}
              disabled={isUpdating}
            >
              Publish
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUnpublish(row.original._id)}
              disabled={isUpdating}
            >
              Unpublish
            </Button>
          )}
        </div>
      ),
    },
  ];
}
