"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAdminEntitiesList, useLinkEntitiesToList } from "@/hooks/use-tn-admin";
import type { PublicTierListEntity } from "@/lib/tier-nation/types";
import { ImageValueAvatar } from "@/components/admin/image-value-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ENTITY_LIST_LIMIT = 200;

type AddExistingEntitiesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  excludeEntityIds?: string[];
  onSuccess?: () => void;
};

export function AddExistingEntitiesDialog({
  open,
  onOpenChange,
  listId,
  excludeEntityIds = [],
  onSuccess,
}: AddExistingEntitiesDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const excludeSet = useMemo(() => new Set(excludeEntityIds), [excludeEntityIds]);

  const entitiesQuery = useAdminEntitiesList(1, ENTITY_LIST_LIMIT, search.trim() || undefined);

  const available = useMemo(
    () => (entitiesQuery.data?.entities ?? []).filter((e) => !excludeSet.has(e.id)),
    [entitiesQuery.data?.entities, excludeSet]
  );

  const linkEntities = useLinkEntitiesToList({
    onSuccess: (data) => {
      const skipped = data.skippedEntityIds?.length;
      toast.success(
        skipped
          ? `Entities linked. ${skipped} already on this list were skipped.`
          : "Entities linked to list."
      );
      setSelected(new Set());
      setSearch("");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  function toggleEntity(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelected(new Set());
      setSearch("");
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit() {
    const entityIds = [...selected];
    if (!entityIds.length) {
      toast.error("Select at least one entity.");
      return;
    }
    await linkEntities.mutate({ listId, body: { entityIds } });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add existing entities</DialogTitle>
          <DialogDescription>
            Link entities already in the catalog to this list. Entities stay in the catalog if you
            remove or delete the list later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entity-search">Search</Label>
            <Input
              id="entity-search"
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
              placeholder="Name or team"
            />
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
            {entitiesQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading entities…</p>
            ) : entitiesQuery.isError ? (
              <p className="text-destructive text-sm">Failed to load entities.</p>
            ) : available.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {entitiesQuery.data?.entities?.length
                  ? "All matching entities are already on this list."
                  : "No entities found. Create some on the Entities page first."}
              </p>
            ) : (
              available.map((entity) => (
                <EntityPickRow
                  key={entity.id}
                  entity={entity}
                  checked={selected.has(entity.id)}
                  disabled={linkEntities.isPending}
                  onToggle={() => toggleEntity(entity.id)}
                />
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={linkEntities.isPending || selected.size === 0}
            onClick={() => onSubmit()}
          >
            {linkEntities.isPending
              ? "Linking…"
              : `Add ${selected.size || ""} to list`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EntityPickRow({
  entity,
  checked,
  disabled,
  onToggle,
}: {
  entity: PublicTierListEntity;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      {entity.imageUrl?.trim() ? (
        <ImageValueAvatar
          value={entity.imageUrl.trim()}
          alt={entity.name}
          fallback={entity.name.slice(0, 2).toUpperCase()}
          className="h-8 w-8 rounded-md"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{entity.name}</div>
        {entity.team ? (
          <div className="text-muted-foreground truncate text-xs">{entity.team}</div>
        ) : null}
      </div>
    </label>
  );
}
