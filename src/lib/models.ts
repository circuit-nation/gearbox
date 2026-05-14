import mongoose, { Schema } from "mongoose";

const EventLinksSchema = new Schema(
  {
    instagram: String,
    youtube: String,
    discord: String,
    x: String,
    sources: [String],
  },
  { timestamps: true },
);

const SportSchema = new Schema(
  {
    name: { type: String, required: true },
    logo: { type: String, required: true },
    color: { type: String, required: true },
    type: { type: String, required: true },
    tags: [String],
  },
  { timestamps: true },
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
    images: [String], //can include s3 keys
  },
  { timestamps: true },
);

const DriverSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    sport: { type: String, required: true },
    team: { type: String, default: "" },
    points: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true },
);

export const EventLinksModel =
  mongoose.models.EventLinks ||
  mongoose.model("EventLinks", EventLinksSchema, "event_links");

export const SportModel =
  mongoose.models.Sport || mongoose.model("Sport", SportSchema, "sports");

export const EventModel =
  mongoose.models.Event || mongoose.model("Event", EventSchema, "events");

export const DriverModel =
  mongoose.models.Driver || mongoose.model("Driver", DriverSchema, "drivers");

const TierNationListSubmissionSchema = new Schema(
  {
    listId: { type: String, required: true, index: true, unique: true },
    name: { type: String, required: true },
    /** Same convention as drivers/events: `s3://…` or external URL. */
    coverImage: { type: String, default: null },
  },
  { timestamps: true },
);

const TierNationEntitySubmissionSchema = new Schema(
  {
    /** Tier list UUID when attached; null for standalone pool. */
    listId: { type: String, default: null, index: true },
    name: { type: String, required: true },
    team: { type: String, default: "" },
    tags: [String],
    description: { type: String, default: "" },
    /** Same convention as drivers: `s3://…` or external URL. */
    image: { type: String, default: null },
    source: { type: String, enum: ["standalone", "list"], required: true },
  },
  { timestamps: true },
);

export const TierNationListSubmissionModel =
  mongoose.models.TierNationListSubmission ||
  mongoose.model("TierNationListSubmission", TierNationListSubmissionSchema, "tier_nation_list_submissions");

export const TierNationEntitySubmissionModel =
  mongoose.models.TierNationEntitySubmission ||
  mongoose.model(
    "TierNationEntitySubmission",
    TierNationEntitySubmissionSchema,
    "tier_nation_entity_submissions"
  );
