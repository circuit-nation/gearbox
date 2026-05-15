import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageUpload } from "@/hooks/use-image-upload";
import { ALLOWED_IMAGE_EXTENSIONS } from "@/lib/image-upload";
import { Loader2, Plus } from "lucide-react";
import { CreateSport, Sport, SportsType } from "@/lib/circuit-nation/types";
import { ResolvedImagePreview } from "../resolved-image-preview";

const SPORTS_TYPES: SportsType[] = [
  "formula",
  "feeder",
  "indycar",
  "motogp",
  "superbike",
  "endurance",
  "off-road",
  "nascar",
];

type SportsCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateSport;
  setFormData: Dispatch<SetStateAction<CreateSport>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
};

type SportsEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Sport>;
  setFormData: Dispatch<SetStateAction<Partial<Sport>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
};

export function SportsCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
}: SportsCreateDialogProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const [logoInputMode, setLogoInputMode] = useState<"url" | "upload">("url");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setLogoInputMode("url");
      setUploadError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleLogoUpload = async (file?: File) => {
    if (!file) {
      return;
    }

    setUploadError(null);

    try {
      const logoUrl = await uploadImage({
        file,
        folder: "sports",
        entityName: formData.name || "sport",
      });
      setFormData((prev) => ({ ...prev, logo: logoUrl }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload image.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Sport
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Sport</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Formula 1"
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as SportsType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORTS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="logo">Logo URL or S3 Key</Label>
            <Tabs
              value={logoInputMode}
              onValueChange={(value) => setLogoInputMode(value as "url" | "upload")}
              className="mt-2"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-2">
                <Input
                  id="logo"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="https://... or s3://sports/..."
                  required={logoInputMode === "url"}
                />
              </TabsContent>
              <TabsContent value="upload" className="mt-2 space-y-2">
                <Input
                  id="logo-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,.webp"
                  onChange={(e) => {
                    void handleLogoUpload(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                  disabled={isUploading}
                />
                <p className="text-muted-foreground text-xs">
                  Allowed: {ALLOWED_IMAGE_EXTENSIONS.join(", ")}. Max size: 10MB.
                </p>
              </TabsContent>
            </Tabs>
            {uploadError && <p className="text-destructive mt-2 text-sm">{uploadError}</p>}
            <ResolvedImagePreview
              value={formData.logo}
              alt={`${formData.name || "Sport"} preview`}
              className="bg-muted/20 mt-2 h-32 w-32 overflow-hidden rounded-md border"
            />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags?.join(", ") || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="racing, motorsport"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
            {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Sport
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SportsEditDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
}: SportsEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sport</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Formula 1"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as SportsType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORTS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-logo">Logo URL or S3 Key</Label>
            <Input
              id="edit-logo"
              value={formData.logo || ""}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://... or s3://sports/..."
              required
            />
            <ResolvedImagePreview
              value={formData.logo}
              alt={`${formData.name || "Sport"} preview`}
              className="bg-muted/20 mt-2 h-32 w-32 overflow-hidden rounded-md border"
            />
          </div>
          <div>
            <Label htmlFor="edit-color">Color</Label>
            <Input
              id="edit-color"
              type="color"
              value={formData.color || "#000000"}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
              value={formData.tags?.join(", ") || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="racing, motorsport"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Sport
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
