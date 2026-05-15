import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
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
import { CreateTeam, Team } from "@/lib/circuit-nation/types";
import { ResolvedImagePreview } from "../resolved-image-preview";

type SportOption = { _id: string; name: string };

type TeamsCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateTeam;
  setFormData: Dispatch<SetStateAction<CreateTeam>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
};

type TeamsEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Team>;
  setFormData: Dispatch<SetStateAction<Partial<Team>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
};

export function TeamsCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
}: TeamsCreateDialogProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const [logoInputMode, setLogoInputMode] = useState<"url" | "upload">("url");
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLogoInputMode("url");
      setUploadError(null);
    }
  }, [open]);

  const handleLogoUpload = async (file?: File) => {
    if (!file) return;
    setUploadError(null);
    try {
      const logoUrl = await uploadImage({
        file,
        folder: "teams",
        entityName: formData.name || "team",
      });
      setFormData((prev) => ({ ...prev, logo: logoUrl }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload image.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., McLaren"
              required
            />
          </div>
          <div>
            <Label htmlFor="sport_id">Sport</Label>
            <Select
              value={formData.sport_id}
              onValueChange={(value) => setFormData({ ...formData, sport_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                {sports?.map((sport) => (
                  <SelectItem key={sport._id} value={sport._id}>
                    {sport.name}
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
                  placeholder="https://... or s3://teams/..."
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
              alt={`${formData.name || "Team"} preview`}
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
              placeholder="f1, works"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
            {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Team
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamsEditDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
}: TeamsEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-sport_id">Sport</Label>
            <Select
              value={formData.sport_id}
              onValueChange={(value) => setFormData({ ...formData, sport_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                {sports?.map((sport) => (
                  <SelectItem key={sport._id} value={sport._id}>
                    {sport.name}
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
              required
            />
            <ResolvedImagePreview
              value={formData.logo}
              alt={`${formData.name || "Team"} preview`}
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
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Team
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
