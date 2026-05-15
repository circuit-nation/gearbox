import type { Dispatch, FormEvent, SetStateAction } from "react";
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
import {
  CreateDriverLeaderboard,
  CreateTeamLeaderboard,
  DriverLeaderboardEntry,
} from "@/lib/circuit-nation/types";
import { PointsUpdateMode } from "@/hooks/use-leaderboard";
import { Loader2, Plus } from "lucide-react";

type SportOption = { _id: string; name: string };
type DriverOption = { _id: string; name: string; sport_id: string };
type TeamOption = { _id: string; name: string; sport_id: string };

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

type DriverLeaderboardForm = CreateDriverLeaderboard;
type TeamLeaderboardForm = CreateTeamLeaderboard;

type DriverCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: DriverLeaderboardForm;
  setFormData: Dispatch<SetStateAction<DriverLeaderboardForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  drivers?: DriverOption[];
  teams?: TeamOption[];
  isSubmitting: boolean;
};

type DriverEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<DriverLeaderboardForm>;
  setFormData: Dispatch<SetStateAction<Partial<DriverLeaderboardForm>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  drivers?: DriverOption[];
  teams?: TeamOption[];
  isSubmitting: boolean;
};

type TeamCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: TeamLeaderboardForm;
  setFormData: Dispatch<SetStateAction<TeamLeaderboardForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  teams?: TeamOption[];
  isSubmitting: boolean;
};

type TeamEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<TeamLeaderboardForm>;
  setFormData: Dispatch<SetStateAction<Partial<TeamLeaderboardForm>>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sports?: SportOption[];
  teams?: TeamOption[];
  isSubmitting: boolean;
};

function entryPoints(entry: DriverLeaderboardEntry | null) {
  return entry?.stats?.points ?? entry?.points ?? 0;
}

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

        <div className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">{driver?.name || "Driver"}</span> currently
          has <span className="text-foreground font-semibold">{entryPoints(driver)}</span> points.
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

export function LeaderboardDriverCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  drivers,
  teams,
  isSubmitting,
}: DriverCreateDialogProps) {
  const filteredDrivers = drivers?.filter((driver) => driver.sport_id === formData.sport_id) ?? [];
  const filteredTeams = teams?.filter((team) => team.sport_id === formData.sport_id) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Driver Entry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Driver Leaderboard Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="driver-lb-year">Year</Label>
              <Input
                id="driver-lb-year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="driver-lb-rank">Rank</Label>
              <Input
                id="driver-lb-rank"
                type="number"
                value={formData.stats.rank}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stats: { ...formData.stats, rank: Number(e.target.value) },
                  })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="driver-lb-sport">Sport</Label>
            <Select
              value={formData.sport_id}
              onValueChange={(value) =>
                setFormData({ ...formData, sport_id: value, driver_id: "", team_id: null })
              }
            >
              <SelectTrigger id="driver-lb-sport">
                <SelectValue placeholder="Select sport" />
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
            <Label htmlFor="driver-lb-driver">Driver</Label>
            <Select
              value={formData.driver_id}
              onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
              disabled={!formData.sport_id}
            >
              <SelectTrigger id="driver-lb-driver">
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {filteredDrivers.map((driver) => (
                  <SelectItem key={driver._id} value={driver._id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="driver-lb-team">Team (optional)</Label>
            <Select
              value={formData.team_id || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, team_id: value === "none" ? null : value })
              }
              disabled={!formData.sport_id}
            >
              <SelectTrigger id="driver-lb-team">
                <SelectValue placeholder="Unassigned" />
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
            <Label htmlFor="driver-lb-points">Points</Label>
            <Input
              id="driver-lb-points"
              type="number"
              value={formData.stats.points}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stats: { ...formData.stats, points: Number(e.target.value) },
                })
              }
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Entry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LeaderboardDriverEditDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  drivers,
  teams,
  isSubmitting,
}: DriverEditDialogProps) {
  const filteredDrivers = drivers?.filter((driver) => driver.sport_id === formData.sport_id) ?? [];
  const filteredTeams = teams?.filter((team) => team.sport_id === formData.sport_id) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Driver Leaderboard Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-driver-lb-year">Year</Label>
              <Input
                id="edit-driver-lb-year"
                type="number"
                value={formData.year ?? new Date().getFullYear()}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-driver-lb-rank">Rank</Label>
              <Input
                id="edit-driver-lb-rank"
                type="number"
                value={formData.stats?.rank ?? 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stats: {
                      rank: Number(e.target.value),
                      points: formData.stats?.points ?? 0,
                      wins: formData.stats?.wins,
                      podiums: formData.stats?.podiums,
                    },
                  })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-driver-lb-sport">Sport</Label>
            <Select
              value={formData.sport_id}
              onValueChange={(value) =>
                setFormData({ ...formData, sport_id: value, driver_id: "", team_id: null })
              }
            >
              <SelectTrigger id="edit-driver-lb-sport">
                <SelectValue placeholder="Select sport" />
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
            <Label htmlFor="edit-driver-lb-driver">Driver</Label>
            <Select
              value={formData.driver_id}
              onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
              disabled={!formData.sport_id}
            >
              <SelectTrigger id="edit-driver-lb-driver">
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {filteredDrivers.map((driver) => (
                  <SelectItem key={driver._id} value={driver._id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-driver-lb-team">Team (optional)</Label>
            <Select
              value={formData.team_id || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, team_id: value === "none" ? null : value })
              }
              disabled={!formData.sport_id}
            >
              <SelectTrigger id="edit-driver-lb-team">
                <SelectValue placeholder="Unassigned" />
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
            <Label htmlFor="edit-driver-lb-points">Points</Label>
            <Input
              id="edit-driver-lb-points"
              type="number"
              value={formData.stats?.points ?? 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stats: {
                    rank: formData.stats?.rank ?? 0,
                    points: Number(e.target.value),
                    wins: formData.stats?.wins,
                    podiums: formData.stats?.podiums,
                  },
                })
              }
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Entry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LeaderboardTeamCreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  teams,
  isSubmitting,
}: TeamCreateDialogProps) {
  const filteredTeams = teams?.filter((team) => team.sport_id === formData.sport_id) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Team Entry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Team Leaderboard Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="team-lb-year">Year</Label>
              <Input
                id="team-lb-year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="team-lb-rank">Rank</Label>
              <Input
                id="team-lb-rank"
                type="number"
                value={formData.stats.rank}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stats: { ...formData.stats, rank: Number(e.target.value) },
                  })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="team-lb-sport">Sport</Label>
            <Select
              value={formData.sport_id}
              onValueChange={(value) => setFormData({ ...formData, sport_id: value, team_id: "" })}
            >
              <SelectTrigger id="team-lb-sport">
                <SelectValue placeholder="Select sport" />
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
            <Label htmlFor="team-lb-team">Team</Label>
            <Select
              value={formData.team_id}
              onValueChange={(value) => setFormData({ ...formData, team_id: value })}
              disabled={!formData.sport_id}
            >
              <SelectTrigger id="team-lb-team">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {filteredTeams.map((team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="team-lb-points">Points</Label>
            <Input
              id="team-lb-points"
              type="number"
              value={formData.stats.points}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stats: { ...formData.stats, points: Number(e.target.value) },
                })
              }
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Entry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LeaderboardTeamEditDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  sports,
  teams,
  isSubmitting,
}: TeamEditDialogProps) {
  const filteredTeams = teams?.filter((team) => team.sport_id === formData.sport_id) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Leaderboard Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-team-lb-year">Year</Label>
              <Input
                id="edit-team-lb-year"
                type="number"
                value={formData.year ?? new Date().getFullYear()}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-team-lb-rank">Rank</Label>
              <Input
                id="edit-team-lb-rank"
                type="number"
                value={formData.stats?.rank ?? 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stats: {
                      rank: Number(e.target.value),
                      points: formData.stats?.points ?? 0,
                      wins: formData.stats?.wins,
                      podiums: formData.stats?.podiums,
                    },
                  })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-team-lb-sport">Sport</Label>
            <Select
              value={formData.sport_id}
              onValueChange={(value) => setFormData({ ...formData, sport_id: value, team_id: "" })}
            >
              <SelectTrigger id="edit-team-lb-sport">
                <SelectValue placeholder="Select sport" />
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
            <Label htmlFor="edit-team-lb-team">Team</Label>
            <Select
              value={formData.team_id}
              onValueChange={(value) => setFormData({ ...formData, team_id: value })}
              disabled={!formData.sport_id}
            >
              <SelectTrigger id="edit-team-lb-team">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {filteredTeams.map((team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-team-lb-points">Points</Label>
            <Input
              id="edit-team-lb-points"
              type="number"
              value={formData.stats?.points ?? 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stats: {
                    rank: formData.stats?.rank ?? 0,
                    points: Number(e.target.value),
                    wins: formData.stats?.wins,
                    podiums: formData.stats?.podiums,
                  },
                })
              }
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Entry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
