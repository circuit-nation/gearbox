import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimePicker } from "@/components/ui/time-picker";
import { useImageUpload } from "@/hooks/use-image-upload";
import { ALLOWED_IMAGE_EXTENSIONS } from "@/lib/image-upload";
import { Loader2, Plus } from "lucide-react";
import { CreateEvent, Event, EventType } from "@/lib/schema";
import { ResolvedImagePreview } from "../resolved-image-preview";

const EVENT_TYPES: EventType[] = [
  "race",
  "qualifying",
  "practice",
  "sprint",
  "test",
  "shootout",
  "warmup",
  "demo",
  "news",
  "announcement",
  "update",
  "watch-party",
];

type SportOption = {
  _id: string;
  name: string;
};

type EventsCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateEvent;
  setFormData: Dispatch<SetStateAction<CreateEvent>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  setStartTime: Dispatch<SetStateAction<string>>;
  setEndDate: Dispatch<SetStateAction<string>>;
  setEndTime: Dispatch<SetStateAction<string>>;
  buildIsoDateTime: (date: string, time: string) => string;
};

type EventsEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Event>;
  setFormData: Dispatch<SetStateAction<Partial<Event>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  setStartTime: Dispatch<SetStateAction<string>>;
  setEndDate: Dispatch<SetStateAction<string>>;
  setEndTime: Dispatch<SetStateAction<string>>;
  buildIsoDateTime: (date: string, time: string) => string;
};

export function EventsCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
  startDate,
  startTime,
  endDate,
  endTime,
  setStartDate,
  setStartTime,
  setEndDate,
  setEndTime,
  buildIsoDateTime,
}: EventsCreateDialogProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const [imagesInputMode, setImagesInputMode] = useState<"url" | "upload">("url");
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setImagesInputMode("url");
      setUploadError(null);
    }
  }, [open]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setUploadError(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const imageUrl = await uploadImage({
          file,
          folder: "events",
          entityName: formData.title || formData.id || "event",
        });
        uploadedUrls.push(imageUrl);
      }
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload one or more images.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id">ID</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., monaco-gp-2024"
                required
              />
            </div>
            <div>
              <Label htmlFor="round">Round</Label>
              <Input
                id="round"
                type="number"
                value={formData.round}
                onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Monaco Grand Prix"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sport">Sport</Label>
              <Select value={formData.sport_id} onValueChange={(value) => setFormData({ ...formData, sport_id: value })}>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="circuit_id">Circuit ID</Label>
              <Input
                id="circuit_id"
                value={formData.circuit_id}
                onChange={(e) => setFormData({ ...formData, circuit_id: e.target.value })}
                placeholder="Circuit document ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="links_id">Links ID (Optional)</Label>
              <Input
                id="links_id"
                value={formData.links_id || ""}
                onChange={(e) => setFormData({ ...formData, links_id: e.target.value })}
                placeholder="Optional event_links document ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              id="event_start_date"
              label="Start Date"
              value={startDate}
              onChange={(value) => {
                setStartDate(value);
                const nextIso = buildIsoDateTime(value, startTime);
                setFormData((prev) => ({ ...prev, event_start_at: nextIso }));
              }}
              required
            />
            <TimePicker
              id="event_start_time"
              label="Start Time"
              value={startTime}
              onChange={(value) => {
                setStartTime(value);
                const nextIso = buildIsoDateTime(startDate, value);
                setFormData((prev) => ({ ...prev, event_start_at: nextIso }));
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              id="event_end_date"
              label="End Date"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                const nextIso = buildIsoDateTime(value, endTime);
                setFormData((prev) => ({ ...prev, event_end_at: nextIso }));
              }}
              required
            />
            <TimePicker
              id="event_end_time"
              label="End Time"
              value={endTime}
              onChange={(value) => {
                setEndTime(value);
                const nextIso = buildIsoDateTime(endDate, value);
                setFormData((prev) => ({ ...prev, event_end_at: nextIso }));
              }}
              required
            />
          </div>

          <div>
            <Label htmlFor="images">Image URLs or S3 Keys (comma-separated)</Label>
            <Tabs
              value={imagesInputMode}
              onValueChange={(value) => setImagesInputMode(value as "url" | "upload")}
              className="mt-2"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-2">
                <Input
                  id="images"
                  value={formData.images?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      images: e.target.value.split(",").map((url) => url.trim()).filter(Boolean),
                    })
                  }
                  placeholder="https://image1.jpg, s3://events/image2.jpg"
                />
              </TabsContent>
              <TabsContent value="upload" className="mt-2 space-y-2">
                <Input
                  id="images-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,.webp"
                  multiple
                  onChange={(e) => {
                    void handleImageUpload(e.target.files);
                    e.currentTarget.value = "";
                  }}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  Allowed: {ALLOWED_IMAGE_EXTENSIONS.join(", ")}. Max size: 10MB.
                </p>
              </TabsContent>
            </Tabs>
            {uploadError && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
            {Boolean(formData.images?.length) && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {formData.images?.map((image, index) => (
                  <ResolvedImagePreview
                    key={`${image}-${index}`}
                    value={image}
                    alt={`Event preview ${index + 1}`}
                    className="h-24 overflow-hidden rounded-md border bg-muted/20"
                  />
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
            {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Event
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EventsEditDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
  startDate,
  startTime,
  endDate,
  endTime,
  setStartDate,
  setStartTime,
  setEndDate,
  setEndTime,
  buildIsoDateTime,
}: EventsEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-round">Round</Label>
              <Input
                id="edit-round"
                type="number"
                value={formData.round || 1}
                onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Monaco Grand Prix"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-sport">Sport</Label>
              <Select value={formData.sport_id} onValueChange={(value) => setFormData({ ...formData, sport_id: value })}>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-circuit_id">Circuit ID</Label>
              <Input
                id="edit-circuit_id"
                value={formData.circuit_id || ""}
                onChange={(e) => setFormData({ ...formData, circuit_id: e.target.value })}
                placeholder="Circuit document ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-links_id">Links ID (Optional)</Label>
              <Input
                id="edit-links_id"
                value={formData.links_id || ""}
                onChange={(e) => setFormData({ ...formData, links_id: e.target.value })}
                placeholder="Optional event_links document ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              id="edit-event_start_date"
              label="Start Date"
              value={startDate}
              onChange={(value) => {
                setStartDate(value);
                const nextIso = buildIsoDateTime(value, startTime);
                setFormData((prev) => ({ ...prev, event_start_at: nextIso }));
              }}
              required
            />
            <TimePicker
              id="edit-event_start_time"
              label="Start Time"
              value={startTime}
              onChange={(value) => {
                setStartTime(value);
                const nextIso = buildIsoDateTime(startDate, value);
                setFormData((prev) => ({ ...prev, event_start_at: nextIso }));
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              id="edit-event_end_date"
              label="End Date"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                const nextIso = buildIsoDateTime(value, endTime);
                setFormData((prev) => ({ ...prev, event_end_at: nextIso }));
              }}
              required
            />
            <TimePicker
              id="edit-event_end_time"
              label="End Time"
              value={endTime}
              onChange={(value) => {
                setEndTime(value);
                const nextIso = buildIsoDateTime(endDate, value);
                setFormData((prev) => ({ ...prev, event_end_at: nextIso }));
              }}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-images">Image URLs or S3 Keys (comma-separated)</Label>
            <Input
              id="edit-images"
              value={formData.images?.join(", ") || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  images: e.target.value.split(",").map((url) => url.trim()).filter(Boolean),
                })
              }
              placeholder="https://image1.jpg, s3://events/image2.jpg"
            />
            {Boolean(formData.images?.length) && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {formData.images?.map((image, index) => (
                  <ResolvedImagePreview
                    key={`${image}-${index}`}
                    value={image}
                    alt={`Event preview ${index + 1}`}
                    className="h-24 overflow-hidden rounded-md border bg-muted/20"
                  />
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Event
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
