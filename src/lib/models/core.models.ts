import mongoose, { Schema } from "mongoose";

const EventLinksSchema = new Schema(
  {
    instagram: String,
    youtube: String,
    discord: String,
    x: String,
    sources: [String],
  },
  { timestamps: true }
);

const SportSchema = new Schema(
  {
    name: { type: String, required: true },
    logo: { type: String, required: true },
    color: { type: String, required: true },
    type: { type: String, required: true },
    tags: [String],
  },
  { timestamps: true }
);

const CircuitSchema = new Schema(
  {
    name: { type: String, required: true },
    location_str: { type: String, required: true },
    country: { type: String, required: true },
    country_code: { type: String, required: true },
    image: { type: String, default: "" },

    // object of latitude and longitude
    location: {
      type: { latitude: Number, longitude: Number },
      default: { latitude: 0, longitude: 0 },
    },

    sport_id: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },

    tags: [String],
  },
  { timestamps: true }
);

const TeamSchema = new Schema(
  {
    name: { type: String, required: true },
    logo: { type: String, required: true },
    color: { type: String, required: true },

    sport_id: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },

    tags: [String],
  },
  { timestamps: true }
);

const DriverSchema = new Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },

    sport_id: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },

    team_id: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    points: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true }
);

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    round: { type: Number, required: true },
    type: { type: String, required: true },

    circuit_id: {
      type: Schema.Types.ObjectId,
      ref: "Circuit",
      required: true,
    },

    links_id: {
      type: Schema.Types.ObjectId,
      ref: "EventLinks",
      default: null,
    },

    sport_id: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },

    event_start_at: { type: Date, required: true },
    event_end_at: { type: Date, required: true },

    images: [String], // can include s3 keys
  },
  { timestamps: true }
);

export const EventLinksModel =
  mongoose.models.EventLinks || mongoose.model("EventLinks", EventLinksSchema, "event_links");

export const SportModel = mongoose.models.Sport || mongoose.model("Sport", SportSchema, "sports");

export const CircuitModel =
  mongoose.models.Circuit || mongoose.model("Circuit", CircuitSchema, "circuits");

export const TeamModel = mongoose.models.Team || mongoose.model("Team", TeamSchema, "teams");

export const DriverModel =
  mongoose.models.Driver || mongoose.model("Driver", DriverSchema, "drivers");

export const EventModel = mongoose.models.Event || mongoose.model("Event", EventSchema, "events");
