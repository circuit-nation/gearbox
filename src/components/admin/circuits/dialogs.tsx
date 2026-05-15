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
import { Circuit, CreateCircuit } from "@/lib/circuit-nation/types";
import { ResolvedImagePreview } from "../resolved-image-preview";

type SportOption = { _id: string; name: string };

type CircuitsCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateCircuit;
  setFormData: Dispatch<SetStateAction<CreateCircuit>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
};

type CircuitsEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Circuit>;
  setFormData: Dispatch<SetStateAction<Partial<Circuit>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
};

export function CircuitsCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
}: CircuitsCreateDialogProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const [imageInputMode, setImageInputMode] = useState<"url" | "upload">("url");
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setImageInputMode("url");
      setUploadError(null);
    }
  }, [open]);

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploadError(null);
    try {
      const imageUrl = await uploadImage({
        file,
        folder: "circuits",
        entityName: formData.name || "circuit",
      });
      setFormData((prev) => ({ ...prev, image: imageUrl }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload image.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Circuit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Circuit</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
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
                  value={formData.image || ""}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </TabsContent>
              <TabsContent value="upload" className="mt-2 space-y-2">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,.webp"
                  onChange={(e) => {
                    void handleImageUpload(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                  disabled={isUploading}
                />
                <p className="text-muted-foreground text-xs">
                  Allowed: {ALLOWED_IMAGE_EXTENSIONS.join(", ")}.
                </p>
              </TabsContent>
            </Tabs>
            {uploadError && <p className="text-destructive mt-2 text-sm">{uploadError}</p>}
            <ResolvedImagePreview
              value={formData.image}
              alt={formData.name || "Circuit"}
              className="bg-muted/20 mt-2 h-32 w-32 overflow-hidden rounded-md border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.location.latitude ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      latitude: e.target.value ? Number(e.target.value) : 0,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.location.longitude ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      longitude: e.target.value ? Number(e.target.value) : 0,
                    },
                  })
                }
              />
            </div>
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
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
            {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Circuit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CircuitsEditDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
}: CircuitsEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Circuit</DialogTitle>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={formData.country || ""}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
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
            <Label htmlFor="edit-image">Image URL or S3 Key</Label>
            <Input
              id="edit-image"
              value={formData.image || ""}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Circuit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
