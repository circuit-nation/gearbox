import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sports: defineTable({
    name: v.string(),
    logo: v.string(),
    color: v.string(),
    type: v.union(
      v.literal("formula"),
      v.literal("feeder"),
      v.literal("indycar"),
      v.literal("motogp"),
      v.literal("superbike"),
      v.literal("endurance"),
      v.literal("off-road"),
      v.literal("nascar"),
    ),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_type", ["type"])
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
    }),
  teams: defineTable({
    id: v.string(),
    name: v.string(),
    logo: v.string(),
    sport: v.id("sports"),
    tags: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
  })
    .index("by_sport", ["sport"])
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
    }),
  drivers: defineTable({
    id: v.string(),
    name: v.string(),
    image: v.string(),
    sport: v.id("sports"),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_sport", ["sport"])
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
    }),
  event_links: defineTable({
    instagram: v.optional(v.string()),
    youtube: v.optional(v.string()),
    discord: v.optional(v.string()),
    x: v.optional(v.string()),
    sources: v.optional(v.array(v.string())),
  }),
  events: defineTable({
    id: v.string(),
    title: v.string(),
    round: v.number(),
    type: v.union(
      v.literal("race"),
      v.literal("qualifying"),
      v.literal("practice"),
      v.literal("sprint"),
      v.literal("test"),
      v.literal("shootout"),
      v.literal("warmup"),
      v.literal("demo"),
      v.literal("news"),
      v.literal("announcement"),
      v.literal("update"),
      v.literal("watch-party"),
    ),
    circuit_id: v.id("circuits"), // Reference to circuits table
    links_id: v.optional(v.id("event_links")),
    sport_id: v.id("sports"),
    event_start_at: v.string(),
    event_end_at: v.string(),
    images: v.optional(v.array(v.string())),
  })
    .index("by_sport", ["sport_id"])
    .index("by_circuit", ["circuit_id"])
    .index("by_type", ["type"])
    .index("by_title", ["title"])
    .index("by_start", ["event_start_at"])
    .searchIndex("search_title", {
      searchField: "title",
    }),
  circuits: defineTable({
    id: v.string(),
    name: v.string(),
    location_str: v.string(),
    country: v.string(),
    country_code: v.string(),
    location: v.optional(v.array(v.number())), // [longitude, latitude]
    sport_id: v.id("sports"),

    // Visual assets
    image: v.optional(v.string()),
    logo: v.optional(v.string()),
    color: v.optional(v.string()),

    // Technical details
    length_km: v.optional(v.number()),
    turns: v.optional(v.number()),
    laps: v.optional(v.number()),
    lap_record: v.optional(v.string()),
    lap_record_holder: v.optional(v.string()),
    lap_record_year: v.optional(v.number()),

    // Circuit characteristics
    track_type: v.optional(
      v.union(
        v.literal("permanent"),
        v.literal("street"),
        v.literal("temporary"),
        v.literal("mixed"),
      ),
    ),
    direction: v.optional(
      v.union(v.literal("clockwise"), v.literal("counterclockwise")),
    ),
    year_opened: v.optional(v.number()),

    // Metadata
    tags: v.optional(v.array(v.string())),
    official_website: v.optional(v.string()),
  })
    .index("by_sport", ["sport_id"])
    .index("by_name", ["name"])
    .index("by_country", ["country_code"])
    .searchIndex("search_name", {
      searchField: "name",
    })
    .searchIndex("search_location", {
      searchField: "location_str",
    }),
});
