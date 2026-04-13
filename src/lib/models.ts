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
    id: { type: String, required: true },
    name: { type: String, required: true },
    location_str: { type: String, required: true },
    country: { type: String, required: true },
    country_code: { type: String, required: true },
    location: { type: [Number], default: undefined },
    sport_id: { type: String, required: true },
    image: String,
    logo: String,
    color: String,
    length_km: Number,
    turns: Number,
    laps: Number,
    lap_record: String,
    lap_record_holder: String,
    lap_record_year: Number,
    track_type: String,
    direction: String,
    year_opened: Number,
    tags: [String],
    official_website: String,
  },
  { timestamps: true }
);

const EventSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    round: { type: Number, required: true },
    type: { type: String, required: true },
    circuit_id: { type: String, required: true },
    links_id: String,
    sport_id: { type: String, required: true },
    event_start_at: { type: String, required: true },
    event_end_at: { type: String, required: true },
    images: [String],
  },
  { timestamps: true }
);

const TeamSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    logo: { type: String, required: true },
    sport: { type: String, required: true },
    tags: [String],
    color: String,
  },
  { timestamps: true }
);

const DriverSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    sport: { type: String, required: true },
    tags: [String],
  },
  { timestamps: true }
);

export const EventLinksModel =
  mongoose.models.EventLinks ||
  mongoose.model("EventLinks", EventLinksSchema, "event_links");

export const SportModel =
  mongoose.models.Sport || mongoose.model("Sport", SportSchema, "sports");

export const CircuitModel =
  mongoose.models.Circuit ||
  mongoose.model("Circuit", CircuitSchema, "circuits");

export const EventModel =
  mongoose.models.Event || mongoose.model("Event", EventSchema, "events");

export const TeamModel =
  mongoose.models.Team || mongoose.model("Team", TeamSchema, "teams");

export const DriverModel =
  mongoose.models.Driver || mongoose.model("Driver", DriverSchema, "drivers");
