import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { CreateDriver, Driver } from "@/lib/schema";

type SportOption = {
  convexId: string;
  name: string;
};

type DriversCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateDriver;
  setFormData: Dispatch<SetStateAction<CreateDriver>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
};

type DriversEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Driver>;
  setFormData: Dispatch<SetStateAction<Partial<Driver>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  isSubmitting: boolean;
};

export function DriversCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  isSubmitting,
}: DriversCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Label htmlFor="id">ID</Label>
            <Input
              id="id"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="e.g., max-verstappen"
              required
            />
          </div>
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
            <Label htmlFor="sport">Sport</Label>
            <Select value={formData.sport} onValueChange={(value) => setFormData({ ...formData, sport: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                {sports?.map((sport) => (
                  <SelectItem key={sport.convexId} value={sport.convexId}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
              required
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
                  tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                })
              }
              placeholder="champion, dutch"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
  isSubmitting,
}: DriversEditDialogProps) {
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
            <Label htmlFor="edit-sport">Sport</Label>
            <Select value={formData.sport} onValueChange={(value) => setFormData({ ...formData, sport: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                {sports?.map((sport) => (
                  <SelectItem key={sport.convexId} value={sport.convexId}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-image">Image URL</Label>
            <Input
              id="edit-image"
              value={formData.image || ""}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
              required
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
                  tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
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
