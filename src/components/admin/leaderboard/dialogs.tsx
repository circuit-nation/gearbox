import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PointsUpdateMode, DriverLeaderboardEntry } from "@/hooks/use-leaderboard";
import { Loader2 } from "lucide-react";

type PointsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: DriverLeaderboardEntry | null;
  mode: PointsUpdateMode;
  value: string;
  setMode: (mode: PointsUpdateMode) => void;
  setValue: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
};

export function LeaderboardPointsDialog({
  open,
  onOpenChange,
  driver,
  mode,
  value,
  setMode,
  setValue,
  onSubmit,
  isSubmitting,
}: PointsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Driver Points</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{driver?.name || "Driver"}</span>
          {" "}
          currently has
          {" "}
          <span className="font-semibold text-foreground">{driver?.points ?? 0}</span>
          {" "}
          points.
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="points-mode">Mode</Label>
            <Select value={mode} onValueChange={(nextMode: PointsUpdateMode) => setMode(nextMode)}>
              <SelectTrigger id="points-mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add / Subtract</SelectItem>
                <SelectItem value="set">Set Absolute</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="points-value">Value</Label>
            <Input
              id="points-value"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={mode === "add" ? "e.g. 25 or -5" : "e.g. 180"}
              type="number"
              step="any"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === "add" ? "Apply Delta" : "Set Points"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
