import mongoose, { Schema } from "mongoose";

const ArticleSchema = new Schema(
  {
    guid: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    publishedAt: { type: Date, required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ArticleModel =
  mongoose.models.Article || mongoose.model("Article", ArticleSchema, "articles");
