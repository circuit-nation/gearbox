"use client";

import { useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { toast } from "sonner";
import { useAddEntitiesToList, useCreateStandaloneEntities } from "@/hooks/use-tn-admin";
import type { AdminEntityInput } from "@/lib/tier-nation/types";
import { useImageUpload } from "@/hooks/use-image-upload";
import { toTierNationImageField } from "@/lib/tier-nation/tier-nation-image-payload";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

export type EntityFormRow = {
  id: string;
  name: string;
  team: string;
  tags: string;
  description: string;
  imageStored: string;
};

export function emptyEntityRow(): EntityFormRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    team: "",
    tags: "",
    description: "",
    imageStored: "",
  };
}

function rowsToApiPayload(rows: EntityFormRow[]): AdminEntityInput[] {
  const out: AdminEntityInput[] = [];
  for (const row of rows) {
    if (!row.name.trim()) continue;
    const imageUrl = toTierNationImageField(row.imageStored);
    const tags = row.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    out.push({
      name: row.name.trim(),
      team: row.team.trim() || undefined,
      tags: tags.length ? tags : undefined,
      description: row.description.trim(),
      imageUrl,
    });
  }
  return out;
}

type CreateEntitiesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultListId?: string;
  /** Called after a successful admin API create (refetch catalog in parent). */
  onSuccess?: () => void;
};

export function CreateEntitiesDialog({
  open,
  onOpenChange,
  defaultListId,
  onSuccess,
}: CreateEntitiesDialogProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const [listId, setListId] = useState("");
  const [standaloneRows, setStandaloneRows] = useState<EntityFormRow[]>([emptyEntityRow()]);
  const [listRows, setListRows] = useState<EntityFormRow[]>([emptyEntityRow()]);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setListId("");
      setStandaloneRows([emptyEntityRow()]);
      setListRows([emptyEntityRow()]);
    } else if (defaultListId) {
      setListId(defaultListId);
    }
    onOpenChange(nextOpen);
  };

  const createStandalone = useCreateStandaloneEntities({
    onSuccess: () => {
      toast.success("Entities created.");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const addToList = useAddEntitiesToList({
    onSuccess: () => {
      toast.success("Entities added to list.");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  function updateRow(which: "standalone" | "list", id: string, patch: Partial<EntityFormRow>) {
    const set = which === "standalone" ? setStandaloneRows : setListRows;
    set((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function onPickImage(which: "standalone" | "list", row: EntityFormRow, file: File | null) {
    if (!file) return;
    if (!row.name.trim()) {
      toast.error("Enter a name before uploading an image.");
      return;
    }
    try {
      const stored = await uploadImage({
        file,
        folder: "tier_nation/entities",
        entityName: row.name.trim(),
      });
      updateRow(which, row.id, { imageStored: stored });
      toast.success("Image uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function submitStandalone(e: FormEvent) {
    e.preventDefault();
    const entities = await rowsToApiPayload(standaloneRows);
    if (!entities.length) {
      toast.error("Add at least one entity with a name.");
      return;
    }
    await createStandalone.mutate({ entities });
  }

  async function submitToList(e: FormEvent) {
    e.preventDefault();
    const id = defaultListId || listId.trim();
    if (!id) {
      toast.error("List UUID is required.");
      return;
    }
    const entities = await rowsToApiPayload(listRows);
    if (!entities.length) {
      toast.error("Add at least one entity with a name.");
      return;
    }
    await addToList.mutate({ listId: id, body: { entities } });
  }

  function renderRows(
    which: "standalone" | "list",
    rows: EntityFormRow[],
    setRows: Dispatch<SetStateAction<EntityFormRow[]>>,
    pending: boolean
  ) {
    return (
      <div className="overflow-y-auto">
        {rows.map((row, index) => (
          <Card key={row.id} className="border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-1 py-2">
              <CardTitle className="text-sm font-medium">Entity {index + 1}</CardTitle>
              {rows.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove row"
                  onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="grid gap-2 space-y-2 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>Name</Label>
                <Input
                  value={row.name}
                  onChange={(ev) => updateRow(which, row.id, { name: ev.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Team</Label>
                <Input
                  value={row.team}
                  onChange={(ev) => updateRow(which, row.id, { team: ev.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Tags</Label>
                <Input
                  value={row.tags}
                  onChange={(ev) => updateRow(which, row.id, { tags: ev.target.value })}
                  placeholder="Comma-separated"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={row.description}
                  onChange={(ev) => updateRow(which, row.id, { description: ev.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Image</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  disabled={isUploading || pending}
                  onChange={(ev) => onPickImage(which, row, ev.target.files?.[0] ?? null)}
                />
                {row.imageStored.trim() ? (
                  <div className="flex items-center gap-2 pt-1">
                    <ImageValueAvatar
                      value={row.imageStored.trim()}
                      alt={row.name || "Entity"}
                      fallback={(row.name.trim().slice(0, 2) || "?").toUpperCase()}
                      className="h-10 w-10 rounded-md"
                    />
                    <span className="text-muted-foreground text-xs">Via get-image-url</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRows((r) => [...r, emptyEntityRow()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add row
        </Button>
      </div>
    );
  }

  const lockedList = Boolean(defaultListId);
  const pending = createStandalone.isPending || addToList.isPending;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create entities</DialogTitle>
          <DialogDescription>
            Images upload to <Badge variant="secondary">tier_nation/entities</Badge>. Stored
            references match drivers/events (<code className="text-xs">s3://…</code>) and persist in
            this admin database after a successful create.
          </DialogDescription>
        </DialogHeader>
        {lockedList ? (
          <form className="space-y-4" onSubmit={submitToList}>
            <div className="bg-muted/40 rounded-md border px-3 py-2 text-sm">
              <span className="text-muted-foreground">List</span>{" "}
              <span className="font-mono text-xs">{defaultListId}</span>
            </div>
            {renderRows("list", listRows, setListRows, pending)}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Submitting…" : "Add to list"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <Tabs defaultValue="standalone" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standalone">Standalone</TabsTrigger>
              <TabsTrigger value="onlist">On a list</TabsTrigger>
            </TabsList>
            <TabsContent value="standalone" className="mt-4">
              <form className="space-y-4" onSubmit={submitStandalone}>
                {renderRows(
                  "standalone",
                  standaloneRows,
                  setStandaloneRows,
                  createStandalone.isPending
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createStandalone.isPending}>
                    {createStandalone.isPending ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
            <TabsContent value="onlist" className="mt-4">
              <form className="space-y-4" onSubmit={submitToList}>
                <div className="space-y-2">
                  <Label>List UUID</Label>
                  <Input
                    value={listId}
                    onChange={(ev) => setListId(ev.target.value)}
                    placeholder="Tier list id"
                  />
                </div>
                {renderRows("list", listRows, setListRows, addToList.isPending)}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addToList.isPending}>
                    {addToList.isPending ? "Adding…" : "Add to list"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
