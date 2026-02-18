import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const eventTypeValidator = v.union(
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
  v.literal("watch-party")
);

function normalizeFilter(value?: string) {
  return value?.trim().toLowerCase();
}

function compareValues(a: string | number | undefined, b: string | number | undefined, order: "asc" | "desc") {
  const direction = order === "asc" ? 1 : -1;
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1 * direction;
  if (b === undefined) return -1 * direction;
  if (a < b) return -1 * direction;
  if (a > b) return 1 * direction;
  return 0;
}

function toClient(doc: any) {
  return {
    ...doc,
    convexId: doc._id,
  };
}

export const list = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    filterTitle: v.optional(v.string()),
    filterType: v.optional(v.string()),
    filterCircuitId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? DEFAULT_PAGE;
    const limit = args.limit ?? DEFAULT_LIMIT;
    const sortBy = args.sortBy ?? "event_start_at";
    const sortOrder = args.sortOrder ?? "desc";

    let items = await ctx.db.query("events").collect();

    const titleFilter = normalizeFilter(args.filterTitle);
    if (titleFilter) {
      items = items.filter((event) => event.title.toLowerCase().includes(titleFilter));
    }
    if (args.filterType) {
      items = items.filter((event) => event.type === args.filterType);
    }
    if (args.filterCircuitId) {
      items = items.filter((event) => event.circuit_id === args.filterCircuitId);
    }

    items.sort((a, b) => {
      const getValue = (item: any) => {
        if (sortBy === "_creationTime") {
          return item._creationTime;
        }
        if (sortBy === "event_start_at") return item.event_start_at;
        if (sortBy === "round") return item.round;
        if (sortBy === "title") return item.title;
        if (sortBy === "type") return item.type;
        if (sortBy === "sport_id") return item.sport_id;
        return item[sortBy];
      };
      return compareValues(getValue(a), getValue(b), sortOrder);
    });

    const total = items.length;
    const start = (page - 1) * limit;
    const documents = items.slice(start, start + limit).map(toClient);

    return { total, documents };
  },
});

export const get = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      return null;
    }
    return toClient(doc);
  },
});

export const create = mutation({
  args: {
    data: v.object({
      id: v.string(),
      title: v.string(),
      round: v.number(),
      type: eventTypeValidator,
      circuit_id: v.id("circuits"),
      links_id: v.optional(v.id("event_links")),
      sport_id: v.id("sports"),
      event_start_at: v.string(),
      event_end_at: v.string(),
      images: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("events", args.data);
    const doc = await ctx.db.get(id);
    return doc ? toClient(doc) : null;
  },
});

export const update = mutation({
  args: {
    id: v.id("events"),
    data: v.object({
      id: v.optional(v.string()),
      title: v.optional(v.string()),
      round: v.optional(v.number()),
      type: v.optional(eventTypeValidator),
      circuit_id: v.optional(v.id("circuits")),
      links_id: v.optional(v.id("event_links")),
      sport_id: v.optional(v.id("sports")),
      event_start_at: v.optional(v.string()),
      event_end_at: v.optional(v.string()),
      images: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {};
    Object.entries(args.data).forEach(([key, value]) => {
      if (value !== undefined) {
        patch[key] = value;
      }
    });
    await ctx.db.patch(args.id, patch);
    const doc = await ctx.db.get(args.id);
    return doc ? toClient(doc) : null;
  },
});

export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true, id: args.id };
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("events").collect();
    for (const item of items) {
      await ctx.db.delete(item._id as Id<"events">);
    }
    return { success: true, deleted: items.length };
  },
});
