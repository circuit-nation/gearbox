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
import { CreateDriver, Driver } from "@/lib/circuit-nation/types";
import { ResolvedImagePreview } from "../resolved-image-preview";

type SportOption = { _id: string; name: string };
type TeamOption = { _id: string; name: string; sport_id: string };

type DriversCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateDriver;
  setFormData: Dispatch<SetStateAction<CreateDriver>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  teams?: TeamOption[];
  isSubmitting: boolean;
};

type DriversEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Driver>;
  setFormData: Dispatch<SetStateAction<Partial<Driver>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  teams?: TeamOption[];
  isSubmitting: boolean;
};

export function DriversCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  teams,
  isSubmitting,
}: DriversCreateDialogProps) {
  const filteredTeams = teams?.filter((team) => team.sport_id === formData.sport_id) ?? [];
  const { uploadImage, isUploading } = useImageUpload();
  const [imageInputMode, setImageInputMode] = useState<"url" | "upload">("url");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setImageInputMode("url");
      setUploadError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) {
      return;
    }

    setUploadError(null);

    try {
      const imageUrl = await uploadImage({
        file,
        folder: "drivers",
        entityName: formData.name || "driver",
      });
      setFormData((prev) => ({ ...prev, image: imageUrl }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload image.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Driver</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Max Verstappen"
              required
            />
          </div>
          <div>
            <Label htmlFor="sport_id">Sport</Label>
            <Select
              value={formData.sport_id}
              onValueChange={(value) =>
                setFormData({ ...formData, sport_id: value, team_id: null })
              }
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
            <Label htmlFor="image">Image URL or S3 Key</Label>
            <Tabs
              value={imageInputMode}
              onValueChange={(value) => setImageInputMode(value as "url" | "upload")}
              className="mt-2"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-2">
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://... or s3://drivers/..."
                  required={imageInputMode === "url"}
                />
              </TabsContent>
              <TabsContent value="upload" className="mt-2 space-y-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,.webp"
                  onChange={(e) => {
                    void handleImageUpload(e.target.files?.[0]);
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
              value={formData.image}
              alt={`${formData.name || "Driver"} preview`}
              className="bg-muted/20 mt-2 h-32 w-32 overflow-hidden rounded-md border"
            />
          </div>
          <div>
            <Label htmlFor="team_id">Team</Label>
            <Select
              value={formData.team_id || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, team_id: value === "none" ? null : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {filteredTeams.map((team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              placeholder="champion, dutch"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
            {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Driver
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DriversEditDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  teams,
  isSubmitting,
}: DriversEditDialogProps) {
  const filteredTeams = teams?.filter((team) => team.sport_id === formData.sport_id) ?? [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Max Verstappen"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-sport_id">Sport</Label>
            <Select
              value={formData.sport_id}
              onValueChange={(value) =>
                setFormData({ ...formData, sport_id: value, team_id: null })
              }
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
            <Label htmlFor="edit-image">Image URL or S3 Key</Label>
            <Input
              id="edit-image"
              value={formData.image || ""}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://... or s3://drivers/..."
              required
            />
            <ResolvedImagePreview
              value={formData.image}
              alt={`${formData.name || "Driver"} preview`}
              className="bg-muted/20 mt-2 h-32 w-32 overflow-hidden rounded-md border"
            />
          </div>
          <div>
            <Label htmlFor="edit-team_id">Team</Label>
            <Select
              value={formData.team_id || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, team_id: value === "none" ? null : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {filteredTeams.map((team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              placeholder="champion, dutch"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Driver
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
