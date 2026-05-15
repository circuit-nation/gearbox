"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { useCreateTierList } from "@/hooks/use-tn-admin";
import {
  DEFAULT_TIERS_CONFIG,
  type CreateTierListRequest,
  type TierListResponse,
} from "@/lib/tier-nation/types";
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
import { Switch } from "@/components/ui/switch";

type CreateListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (list: TierListResponse) => void;
};

export function CreateListDialog({ open, onOpenChange, onCreated }: CreateListDialogProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverStored, setCoverStored] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("");
      setDescription("");
      setCoverStored("");
      setStartTime("");
      setEndTime("");
      setIsLocked(false);
      setIsVisible(true);
    }
    onOpenChange(nextOpen);
  };

  const createList = useCreateTierList({
    onSuccess: (data) => {
      toast.success("Tier list created.");
      onCreated(data);
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  async function onCoverFile(file: File | null) {
    if (!file || !name.trim()) {
      toast.error("Enter a list name first, then choose a cover image.");
      return;
    }
    try {
      const stored = await uploadImage({
        file,
        folder: "tier_nation/lists",
        entityName: name.trim() || "cover",
      });
      setCoverStored(stored);
      toast.success("Cover uploaded.");
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
    let coverImage: string | undefined;
    if (coverStored.trim()) {
      coverImage = toTierNationImageField(coverStored);
    }
    const startIso = startTime.trim() ? new Date(startTime) : null;
    const endIso = endTime.trim() ? new Date(endTime) : null;
    if (startIso && Number.isNaN(startIso.getTime())) {
      toast.error("Invalid voting start date.");
      return;
    }
    if (endIso && Number.isNaN(endIso.getTime())) {
      toast.error("Invalid voting end date.");
      return;
    }
    const body: CreateTierListRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      coverImage,
      tiersConfig: DEFAULT_TIERS_CONFIG,
      isLocked,
      isVisible,
      startTime: startIso ? startIso.toISOString() : null,
      endTime: endIso ? endIso.toISOString() : null,
    };
    await createList.mutate(body);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create tier list</DialogTitle>
          <DialogDescription>Standard S–F tiers.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="dlg-tn-name">Name</Label>
            <Input
              id="dlg-tn-name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              placeholder="F1 Drivers 2026"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dlg-tn-desc">Description</Label>
            <Textarea
              id="dlg-tn-desc"
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dlg-tn-cover">Cover image</Label>
            <Input
              id="dlg-tn-cover"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              disabled={isUploading || createList.isPending}
              onChange={(ev) => onCoverFile(ev.target.files?.[0] ?? null)}
            />
            {coverStored.trim() ? (
              <div className="flex items-center gap-3 pt-1">
                <ImageValueAvatar
                  value={coverStored.trim()}
                  alt="Cover preview"
                  fallback="?"
                  className="h-14 w-14 rounded-md"
                />
              </div>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dlg-tn-start">Voting start</Label>
              <Input
                id="dlg-tn-start"
                type="datetime-local"
                value={startTime}
                onChange={(ev) => setStartTime(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dlg-tn-end">Voting end</Label>
              <Input
                id="dlg-tn-end"
                type="datetime-local"
                value={endTime}
                onChange={(ev) => setEndTime(ev.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch id="dlg-locked" checked={isLocked} onCheckedChange={setIsLocked} />
              <Label htmlFor="dlg-locked">Locked</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="dlg-visible" checked={isVisible} onCheckedChange={setIsVisible} />
              <Label htmlFor="dlg-visible">Visible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createList.isPending}>
              {createList.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
