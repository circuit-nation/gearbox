import mongoose, { Schema } from "mongoose";

const LeaderboardEntrySchema = new Schema(
  {
    rank: { type: Number, required: true },
    points: { type: Number, required: true, default: 0 },
    wins: { type: Number, default: 0 },
    podiums: { type: Number, default: 0 },
  },
  { _id: false }
);

const DriverLeaderboardSchema = new Schema(
  {
    year: { type: Number, required: true },

    sport_id: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },

    driver_id: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    team_id: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    stats: {
      type: LeaderboardEntrySchema,
      required: true,
    },
  },
  { timestamps: true }
);

const TeamLeaderboardSchema = new Schema(
  {
    year: { type: Number, required: true },

    sport_id: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },

    team_id: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    stats: {
      type: LeaderboardEntrySchema,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate yearly entries
DriverLeaderboardSchema.index({ year: 1, sport_id: 1, driver_id: 1 }, { unique: true });

TeamLeaderboardSchema.index({ year: 1, sport_id: 1, team_id: 1 }, { unique: true });

export const DriverLeaderboardModel =
  mongoose.models.DriverLeaderboard ||
  mongoose.model("DriverLeaderboard", DriverLeaderboardSchema, "driver_leaderboards");

export const TeamLeaderboardModel =
  mongoose.models.TeamLeaderboard ||
  mongoose.model("TeamLeaderboard", TeamLeaderboardSchema, "team_leaderboards");
