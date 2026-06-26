import mongoose, { Schema } from "mongoose";
import { SOCIAL_WALL_SLOT_IDS } from "@/lib/social-wall/slots";

const SocialWallSlotSchema = new Schema(
  {
    slotId: { type: String, enum: SOCIAL_WALL_SLOT_IDS, required: true, unique: true },
    platform: { type: String, enum: ["yt", "reddit", "ig", "substack"], required: true },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    url: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    hasPlay: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SocialWallSlotModel =
  mongoose.models.SocialWallSlot ||
  mongoose.model("SocialWallSlot", SocialWallSlotSchema, "social_wall_slots");
