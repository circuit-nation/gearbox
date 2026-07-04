"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Play } from "lucide-react";
import { toast } from "sonner";
import type { SocialWallSlot } from "@/app/api/social-wall/route";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  SOCIAL_WALL_SLOT_IDS,
  SLOT_GRID_CLASS,
  SLOT_LABELS,
  inferPlatformFromSlotId,
  type SocialWallSlotId,
} from "@/lib/social-wall/slots";

type SocialWallListResponse = {
  data: SocialWallSlot[];
};

type UpdateSocialWallSlotPayload = {
  platform: SocialWallSlot["platform"];
  title: string;
  subtitle: string;
  url: string;
  thumbnailUrl: string;
  hasPlay: boolean;
  isActive: boolean;
};

const socialWallKeys = {
  all: ["social-wall"] as const,
  list: () => [...socialWallKeys.all, "list"] as const,
};

const PLATFORM_LABELS: Record<SocialWallSlot["platform"], string> = {
  yt: "YouTube",
  reddit: "Reddit",
  ig: "Instagram",
  substack: "Substack",
};

async function fetchSocialWallSlots() {
  const res = await fetch("/api/social-wall", { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch social wall slots");
  }
  return (await res.json()) as SocialWallListResponse;
}

async function updateSocialWallSlot(slotId: SocialWallSlotId, payload: UpdateSocialWallSlotPayload) {
  const res = await fetch(`/api/social-wall/${slotId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to update social wall slot");
  }
  return (await res.json()) as { data: SocialWallSlot };
}

function emptySlot(slotId: SocialWallSlotId): SocialWallSlot {
  return {
    _id: slotId,
    slotId,
    platform: inferPlatformFromSlotId(slotId),
    title: "",
    subtitle: "",
    url: "",
    thumbnailUrl: "",
    hasPlay: false,
    isActive: false,
    createdAt: "",
    updatedAt: "",
  };
}

function SlotPreview({
  slot,
  onSelect,
}: {
  slot: SocialWallSlot;
  onSelect: (slotId: SocialWallSlotId) => void;
}) {
  const hasContent = Boolean(slot.title.trim() || slot.thumbnailUrl.trim());
  const platformLabel = PLATFORM_LABELS[slot.platform];

  return (
    <button
      type="button"
      onClick={() => onSelect(slot.slotId)}
      className={cn(
        "group relative min-h-[88px] overflow-hidden rounded-lg border text-left transition-colors",
        "hover:border-primary/60 hover:ring-primary/20 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        slot.isActive
          ? "border-border bg-card"
          : "border-dashed border-muted-foreground/35 bg-muted/30",
        SLOT_GRID_CLASS[slot.slotId]
      )}
    >
      {slot.thumbnailUrl ? (
        <>
          <img
            src={slot.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-black/10" />
        </>
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-muted/80 to-muted/40" />
      )}

      <div className="relative z-10 flex h-full flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="bg-background/80 text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
            {platformLabel}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              slot.isActive
                ? "bg-emerald-500/15 text-emerald-600"
                : "bg-muted text-muted-foreground"
            )}
          >
            {slot.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="space-y-1">
          <p className="line-clamp-2 text-sm leading-snug font-medium">
            {hasContent ? slot.title || "Untitled" : "Empty slot"}
          </p>
          {slot.subtitle ? (
            <p className="text-muted-foreground line-clamp-1 text-xs">{slot.subtitle}</p>
          ) : (
            <p className="text-muted-foreground text-xs">{SLOT_LABELS[slot.slotId]}</p>
          )}
        </div>
      </div>

      {slot.hasPlay ? (
        <span className="bg-primary/90 absolute top-1/2 left-1/2 z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-primary-foreground shadow-md">
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
      ) : null}
    </button>
  );
}

export function SocialWallManager() {
  const queryClient = useQueryClient();
  const [selectedSlotId, setSelectedSlotId] = useState<SocialWallSlotId | null>(null);
  const [platform, setPlatform] = useState<SocialWallSlot["platform"]>("yt");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [hasPlay, setHasPlay] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: socialWallKeys.list(),
    queryFn: fetchSocialWallSlots,
  });

  const slotsById = useMemo(() => {
    const map = new Map<SocialWallSlotId, SocialWallSlot>();
    for (const slotId of SOCIAL_WALL_SLOT_IDS) {
      map.set(slotId, emptySlot(slotId));
    }
    for (const slot of data?.data ?? []) {
      map.set(slot.slotId, slot);
    }
    return map;
  }, [data]);

  const orderedSlots = useMemo(
    () => SOCIAL_WALL_SLOT_IDS.map((slotId) => slotsById.get(slotId) ?? emptySlot(slotId)),
    [slotsById]
  );

  const updateSlot = useMutation({
    mutationFn: ({
      slotId,
      payload,
    }: {
      slotId: SocialWallSlotId;
      payload: UpdateSocialWallSlotPayload;
    }) => updateSocialWallSlot(slotId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialWallKeys.all });
      toast.success("Social wall slot saved.");
      setSelectedSlotId(null);
    },
    onError: () => {
      toast.error("Unable to save slot. Please try again.");
    },
  });

  function openSlotEditor(slotId: SocialWallSlotId) {
    const slot = slotsById.get(slotId) ?? emptySlot(slotId);
    setSelectedSlotId(slotId);
    setPlatform(slot.platform);
    setTitle(slot.title);
    setSubtitle(slot.subtitle);
    setUrl(slot.url);
    setThumbnailUrl(slot.thumbnailUrl);
    setHasPlay(slot.hasPlay);
    setIsActive(slot.isActive);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlotId) {
      return;
    }

    updateSlot.mutate({
      slotId: selectedSlotId,
      payload: {
        platform,
        title: title.trim(),
        subtitle: subtitle.trim(),
        url: url.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        hasPlay,
        isActive,
      },
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Click a tile to edit its link and metadata. The preview mirrors the cn-client homepage grid.
      </p>

      {isLoading ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Loading social wall slots…
        </div>
      ) : (
        <div className="grid grid-cols-4 grid-rows-4 gap-2 rounded-xl border bg-muted/20 p-3 md:gap-3 md:p-4">
          {orderedSlots.map((slot) => (
            <SlotPreview key={slot.slotId} slot={slot} onSelect={openSlotEditor} />
          ))}
        </div>
      )}

      <Dialog open={selectedSlotId !== null} onOpenChange={(open) => !open && setSelectedSlotId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedSlotId ? SLOT_LABELS[selectedSlotId] : "Edit slot"}
            </DialogTitle>
            <DialogDescription>
              Configure platform, copy, and link for this grid tile.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                value={platform}
                onValueChange={(value) => setPlatform(value as SocialWallSlot["platform"])}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yt">YouTube</SelectItem>
                  <SelectItem value="reddit">Reddit</SelectItem>
                  <SelectItem value="ig">Instagram</SelectItem>
                  <SelectItem value="substack">Substack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Tile headline"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                placeholder="Views, likes, or context"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                type="url"
                value={thumbnailUrl}
                onChange={(event) => setThumbnailUrl(event.target.value)}
                placeholder="https://"
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
              <div className="space-y-0.5">
                <Label htmlFor="hasPlay">Show play button</Label>
                <p className="text-muted-foreground text-xs">For video tiles on the homepage.</p>
              </div>
              <Switch id="hasPlay" checked={hasPlay} onCheckedChange={setHasPlay} />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active</Label>
                <p className="text-muted-foreground text-xs">
                  Only active slots appear on the public API.
                </p>
              </div>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {url.trim() ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={url.trim()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview link
                </a>
              </Button>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedSlotId(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSlot.isPending}>
                {updateSlot.isPending ? "Saving…" : "Save slot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
