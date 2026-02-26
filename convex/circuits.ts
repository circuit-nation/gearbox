import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const trackTypeValidator = v.union(
  v.literal("permanent"),
  v.literal("street"),
  v.literal("temporary"),
  v.literal("mixed")
);

const directionValidator = v.union(
  v.literal("clockwise"),
  v.literal("counterclockwise")
);

function normalizeFilter(value?: string) {
  return value?.trim().toLowerCase();
}

function compareValues(
  a: string | number | undefined,
  b: string | number | undefined,
  order: "asc" | "desc"
) {
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
    filterName: v.optional(v.string()),
    filterCountry: v.optional(v.string()),
    filterSport: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? DEFAULT_PAGE;
    const limit = args.limit ?? DEFAULT_LIMIT;
    const sortBy = args.sortBy ?? "_creationTime";
    const sortOrder = args.sortOrder ?? "desc";

    let items = await ctx.db.query("circuits").collect();

    const nameFilter = normalizeFilter(args.filterName);
    if (nameFilter) {
      items = items.filter((circuit) =>
        circuit.name.toLowerCase().includes(nameFilter)
      );
    }
    const countryFilter = normalizeFilter(args.filterCountry);
    if (countryFilter) {
      items = items.filter((circuit) =>
        circuit.country.toLowerCase().includes(countryFilter) ||
        circuit.country_code.toLowerCase().includes(countryFilter)
      );
    }
    if (args.filterSport) {
      items = items.filter((circuit) => circuit.sport_id === args.filterSport);
    }

    items.sort((a, b) => {
      const getValue = (item: any) => {
        if (sortBy === "_creationTime") {
          return item._creationTime;
        }
        if (sortBy === "name") return item.name;
        if (sortBy === "country") return item.country;
        if (sortBy === "length_km") return item.length_km;
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
  args: { id: v.id("circuits") },
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
      name: v.string(),
      location_str: v.string(),
      country: v.string(),
      country_code: v.string(),
      location: v.optional(v.array(v.number())),
      sport_id: v.id("sports"),
      image: v.optional(v.string()),
      logo: v.optional(v.string()),
      color: v.optional(v.string()),
      length_km: v.optional(v.number()),
      turns: v.optional(v.number()),
      laps: v.optional(v.number()),
      lap_record: v.optional(v.string()),
      lap_record_holder: v.optional(v.string()),
      lap_record_year: v.optional(v.number()),
      track_type: v.optional(trackTypeValidator),
      direction: v.optional(directionValidator),
      year_opened: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      official_website: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("circuits", args.data);
    const doc = await ctx.db.get(id);
    return doc ? toClient(doc) : null;
  },
});

export const update = mutation({
  args: {
    id: v.id("circuits"),
    data: v.object({
      id: v.optional(v.string()),
      name: v.optional(v.string()),
      location_str: v.optional(v.string()),
      country: v.optional(v.string()),
      country_code: v.optional(v.string()),
      location: v.optional(v.array(v.number())),
      sport_id: v.optional(v.id("sports")),
      image: v.optional(v.string()),
      logo: v.optional(v.string()),
      color: v.optional(v.string()),
      length_km: v.optional(v.number()),
      turns: v.optional(v.number()),
      laps: v.optional(v.number()),
      lap_record: v.optional(v.string()),
      lap_record_holder: v.optional(v.string()),
      lap_record_year: v.optional(v.number()),
      track_type: v.optional(trackTypeValidator),
      direction: v.optional(directionValidator),
      year_opened: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      official_website: v.optional(v.string()),
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
  args: { id: v.id("circuits") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true, id: args.id };
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("circuits").collect();
    for (const item of items) {
      await ctx.db.delete(item._id as Id<"circuits">);
    }
    return { success: true, deleted: items.length };
  },
});

export const getMany = query({
  args: { ids: v.array(v.id("circuits")) },
  handler: async (ctx, args) => {
    const docs = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return docs.filter(Boolean).map(toClient);
  },
});
