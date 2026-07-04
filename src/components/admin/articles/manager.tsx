"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { useTableState } from "../manager-state";
import { createArticlesColumns } from "./columns";
import type { Article } from "@/app/api/articles/route";

type ArticlesListResponse = {
  data: {
    total: number;
    documents: Article[];
  };
};

async function fetchArticles(page: number, limit: number, status?: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status && status !== "all") {
    params.set("status", status);
  }

  const res = await fetch(`/api/articles?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch articles");
  }
  return (await res.json()) as ArticlesListResponse;
}

async function updateArticleStatus(id: string, status: "draft" | "published") {
  const res = await fetch(`/api/articles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error("Failed to update article");
  }
}

async function syncArticles() {
  const res = await fetch("/api/articles/sync", { method: "POST" });
  if (!res.ok) {
    throw new Error("Sync failed");
  }
  return res.json() as Promise<{
    ok: boolean;
    stats: { inserted: number; updated: number; skipped: number };
  }>;
}

const articlesKeys = {
  all: ["articles"] as const,
  list: (filters: object) => [...articlesKeys.all, "list", filters] as const,
};

export function ArticlesManager() {
  const queryClient = useQueryClient();
  const { pagination, setPagination, sorting, setSorting, resetPage } = useTableState([
    { id: "publishedAt", desc: true },
  ]);
  const [statusFilter, setStatusFilter] = useState("all");

  const filters = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    status: statusFilter,
  };

  const { data, isLoading } = useQuery({
    queryKey: articlesKeys.list(filters),
    queryFn: () => fetchArticles(filters.page, filters.limit, filters.status),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) =>
      updateArticleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
      toast.success("Article updated successfully!");
    },
    onError: () => {
      toast.error("Unable to update article. Please try again.");
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncArticles,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: articlesKeys.all });
      const { inserted, updated, skipped } = result.stats;
      toast.success(`Sync complete: ${inserted} new, ${updated} updated, ${skipped} skipped.`);
    },
    onError: () => {
      toast.error("Unable to sync articles. Please try again.");
    },
  });

  const handlePublish = useCallback(
    (id: string) => {
      updateStatus.mutate({ id, status: "published" });
    },
    [updateStatus]
  );

  const handleUnpublish = useCallback(
    (id: string) => {
      updateStatus.mutate({ id, status: "draft" });
    },
    [updateStatus]
  );

  const columns = useMemo(
    () =>
      createArticlesColumns({
        onPublish: handlePublish,
        onUnpublish: handleUnpublish,
        isUpdating: updateStatus.isPending,
      }),
    [handlePublish, handleUnpublish, updateStatus.isPending]
  );

  const tableData = useMemo(() => data?.data.documents ?? [], [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            resetPage();
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          Sync now
        </Button>
      </div>

      <DataTable
        data={tableData}
        columns={columns}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalCount={data?.data.total ?? 0}
        isLoading={isLoading}
      />
    </div>
  );
}
