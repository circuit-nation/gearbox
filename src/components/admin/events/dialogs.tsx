import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { TimePicker } from "@/components/ui/time-picker";
import { useImageUpload } from "@/hooks/use-image-upload";
import { ALLOWED_IMAGE_EXTENSIONS } from "@/lib/image-upload";
import { Loader2, Plus } from "lucide-react";
import { CreateEvent, Event, EventLinks, EventType } from "@/lib/circuit-nation/types";
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

type CircuitOption = {
  _id: string;
  name: string;
  sport_id: string;
};

type EventLinksForm = Omit<EventLinks, "_id">;

type EventsCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateEvent;
  setFormData: Dispatch<SetStateAction<CreateEvent>>;
  linksForm: EventLinksForm;
  setLinksForm: Dispatch<SetStateAction<EventLinksForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  circuits?: CircuitOption[];
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
  linksForm: EventLinksForm;
  setLinksForm: Dispatch<SetStateAction<EventLinksForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  circuits?: CircuitOption[];
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

function EventLinksFields({
  linksForm,
  setLinksForm,
  idPrefix,
}: {
  linksForm: EventLinksForm;
  setLinksForm: Dispatch<SetStateAction<EventLinksForm>>;
  idPrefix: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor={`${idPrefix}-instagram`}>Instagram</Label>
        <Input
          id={`${idPrefix}-instagram`}
          value={linksForm.instagram || ""}
          onChange={(e) => setLinksForm((prev) => ({ ...prev, instagram: e.target.value }))}
          placeholder="https://instagram.com/..."
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-youtube`}>YouTube</Label>
        <Input
          id={`${idPrefix}-youtube`}
          value={linksForm.youtube || ""}
          onChange={(e) => setLinksForm((prev) => ({ ...prev, youtube: e.target.value }))}
          placeholder="https://youtube.com/..."
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-watch-url`}>Watch URL</Label>
        <Input
          id={`${idPrefix}-watch-url`}
          value={linksForm.watch_url || ""}
          onChange={(e) => setLinksForm((prev) => ({ ...prev, watch_url: e.target.value }))}
          placeholder="https://..."
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-watch-label`}>Watch Label</Label>
        <Input
          id={`${idPrefix}-watch-label`}
          value={linksForm.watch_label || ""}
          onChange={(e) => setLinksForm((prev) => ({ ...prev, watch_label: e.target.value }))}
          placeholder="Watch live"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-discord`}>Discord</Label>
        <Input
          id={`${idPrefix}-discord`}
          value={linksForm.discord || ""}
          onChange={(e) => setLinksForm((prev) => ({ ...prev, discord: e.target.value }))}
          placeholder="https://discord.gg/..."
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-x`}>X (Twitter)</Label>
        <Input
          id={`${idPrefix}-x`}
          value={linksForm.x || ""}
          onChange={(e) => setLinksForm((prev) => ({ ...prev, x: e.target.value }))}
          placeholder="https://x.com/..."
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor={`${idPrefix}-sources`}>Sources (comma-separated)</Label>
        <Input
          id={`${idPrefix}-sources`}
          value={linksForm.sources?.join(", ") || ""}
          onChange={(e) =>
            setLinksForm({
              ...linksForm,
              sources: e.target.value
                .split(",")
                .map((source) => source.trim())
                .filter(Boolean),
            })
          }
          placeholder="https://source1.com, https://source2.com"
        />
      </div>
    </div>
  );
}

export function EventsCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  linksForm,
  setLinksForm,
  onSubmit,
  sports,
  circuits,
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
  const filteredCircuits =
    circuits?.filter((circuit) => circuit.sport_id === formData.sport_id) ?? [];

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setImagesInputMode("url");
      setUploadError(null);
    }
    onOpenChange(nextOpen);
  };

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
          entityName: formData.title || "event",
        });
        uploadedUrls.push(imageUrl);
      }
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }));
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload one or more images."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}
              >
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
              <Select
                value={formData.sport_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, sport_id: value, circuit_id: "" })
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
          </div>

          <div>
            <Label htmlFor="circuit">Circuit</Label>
            <Select
              value={formData.circuit_id}
              onValueChange={(value) => setFormData({ ...formData, circuit_id: value })}
              disabled={!formData.sport_id}
            >
              <SelectTrigger id="circuit">
                <SelectValue
                  placeholder={formData.sport_id ? "Select a circuit" : "Select a sport first"}
                />
              </SelectTrigger>
              <SelectContent>
                {filteredCircuits.map((circuit) => (
                  <SelectItem key={circuit._id} value={circuit._id}>
                    {circuit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <EventLinksFields linksForm={linksForm} setLinksForm={setLinksForm} idPrefix="create" />

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
                      images: e.target.value
                        .split(",")
                        .map((url) => url.trim())
                        .filter(Boolean),
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
                <p className="text-muted-foreground text-xs">
                  Allowed: {ALLOWED_IMAGE_EXTENSIONS.join(", ")}. Max size: 10MB.
                </p>
              </TabsContent>
            </Tabs>
            {uploadError && <p className="text-destructive mt-2 text-sm">{uploadError}</p>}
            {Boolean(formData.images?.length) && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {formData.images?.map((image, index) => (
                  <ResolvedImagePreview
                    key={`${image}-${index}`}
                    value={image}
                    alt={`Event preview ${index + 1}`}
                    className="bg-muted/20 h-24 overflow-hidden rounded-md border"
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
  linksForm,
  setLinksForm,
  onSubmit,
  sports,
  circuits,
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
  const filteredCircuits =
    circuits?.filter((circuit) => circuit.sport_id === formData.sport_id) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
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
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}
              >
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
              <Select
                value={formData.sport_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, sport_id: value, circuit_id: "" })
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
          </div>

          <div>
            <Label htmlFor="edit-circuit">Circuit</Label>
            <Select
              value={formData.circuit_id || ""}
              onValueChange={(value) => setFormData({ ...formData, circuit_id: value })}
              disabled={!formData.sport_id}
            >
              <SelectTrigger id="edit-circuit">
                <SelectValue
                  placeholder={formData.sport_id ? "Select a circuit" : "Select a sport first"}
                />
              </SelectTrigger>
              <SelectContent>
                {filteredCircuits.map((circuit) => (
                  <SelectItem key={circuit._id} value={circuit._id}>
                    {circuit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <EventLinksFields linksForm={linksForm} setLinksForm={setLinksForm} idPrefix="edit" />

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
                  images: e.target.value
                    .split(",")
                    .map((url) => url.trim())
                    .filter(Boolean),
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
                    className="bg-muted/20 h-24 overflow-hidden rounded-md border"
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
