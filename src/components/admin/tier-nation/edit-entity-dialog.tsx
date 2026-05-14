"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { useUpdateEntity } from "@/hooks/use-tn-admin";
import type { PublicTierListEntity, UpdateEntityRequest } from "@/lib/tier-nation/types";
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

type EditEntityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  initial: Pick<PublicTierListEntity, "name" | "description" | "team" | "tags" | "imageUrl">;
  onSaved?: () => void;
};

export function EditEntityDialog({
  open,
  onOpenChange,
  entityId,
  initial,
  onSaved,
}: EditEntityDialogProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState("");
  const [tags, setTags] = useState("");
  const [imageStored, setImageStored] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial.name ?? "");
    setDescription(initial.description ?? "");
    setTeam(initial.team ?? "");
    setTags((initial.tags ?? []).join(", "));
    setImageStored(initial.imageUrl?.trim() ?? "");
  }, [open, initial]);

  const updateEntity = useUpdateEntity({
    onSuccess: () => {
      toast.success("Entity updated.");
      onSaved?.();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  async function onImageFile(file: File | null) {
    if (!file || !name.trim()) {
      toast.error("Enter a name first, then choose an image.");
      return;
    }
    try {
      const stored = await uploadImage({
        file,
        folder: "tier_nation/entities",
        entityName: name.trim(),
      });
      setImageStored(stored);
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    let imageUrl: string | null | undefined;
    if (imageStored.trim()) {
      imageUrl = toTierNationImageField(imageStored);
    } else {
      imageUrl = null;
    }
    const body: UpdateEntityRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      team: team.trim() || undefined,
      tags: tagList.length ? tagList : undefined,
      imageUrl,
    };
    await updateEntity.mutate({ entityId, body });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit entity</DialogTitle>
          <DialogDescription>PATCH /admin/entities/:id</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="edit-ent-name">Name</Label>
            <Input
              id="edit-ent-name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ent-team">Team</Label>
            <Input id="edit-ent-team" value={team} onChange={(ev) => setTeam(ev.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ent-tags">Tags</Label>
            <Input
              id="edit-ent-tags"
              value={tags}
              onChange={(ev) => setTags(ev.target.value)}
              placeholder="Comma-separated"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ent-desc">Description</Label>
            <Textarea
              id="edit-ent-desc"
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ent-img">Image</Label>
            <Input
              id="edit-ent-img"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              disabled={isUploading || updateEntity.isPending}
              onChange={(ev) => onImageFile(ev.target.files?.[0] ?? null)}
            />
            {imageStored.trim() ? (
              <div className="flex items-center gap-2 pt-1">
                <ImageValueAvatar
                  value={imageStored.trim()}
                  alt={name || "Entity"}
                  fallback={(name.trim().slice(0, 2) || "?").toUpperCase()}
                  className="h-10 w-10 rounded-md"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateEntity.isPending}>
              {updateEntity.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
