import { Types } from "mongoose";
import { z } from "zod";

const objectIdSchema = z
  .string()
  .min(1)
  .refine((value) => Types.ObjectId.isValid(value), "Invalid id.");

const optionalObjectIdSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value || value === "null" || value === "none") {
      return null;
    }
    return value;
  })
  .refine((value) => value === null || Types.ObjectId.isValid(value), "Invalid id.");

export const sportsTypeSchema = z.enum([
  "formula",
  "feeder",
  "indycar",
  "motogp",
  "superbike",
  "endurance",
  "off-road",
  "nascar",
]);

export const eventTypeSchema = z.enum([
  "race",
  "qualifying",
  "practice",
  "sprint",
  "test",
  "shootout",
  "warmup",
  "demo",
  "news",
  "announcement",
  "update",
  "watch-party",
]);

export const leaderboardStatsSchema = z.object({
  rank: z.number().int().min(1),
  points: z.number().default(0),
  wins: z.number().int().min(0).optional(),
  podiums: z.number().int().min(0).optional(),
});

export const eventLinksSchema = z.object({
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  discord: z.string().optional(),
  x: z.string().optional(),
  sources: z.array(z.string()).optional(),
});

export const sportSchema = z.object({
  name: z.string().min(1),
  logo: z.string().min(1),
  color: z.string().min(1),
  type: sportsTypeSchema,
  tags: z.array(z.string()).optional(),
});

export const teamSchema = z.object({
  name: z.string().min(1),
  logo: z.string().min(1),
  color: z.string().min(1),
  sport_id: objectIdSchema,
  tags: z.array(z.string()).optional(),
});

const circuitLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const circuitSchema = z.object({
  name: z.string().min(1),
  location_str: z.string().min(1),
  country: z.string().min(1),
  country_code: z.string().min(1),
  image: z.string().optional().default(""),
  location: circuitLocationSchema.default({ latitude: 0, longitude: 0 }),
  sport_id: objectIdSchema,
  tags: z.array(z.string()).optional(),
});

export const driverSchema = z.object({
  name: z.string().min(1),
  image: z.string().min(1),
  sport_id: objectIdSchema,
  team_id: optionalObjectIdSchema,
  points: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const eventSchema = z.object({
  title: z.string().min(1),
  round: z.number().int(),
  type: eventTypeSchema,
  circuit_id: objectIdSchema,
  links_id: optionalObjectIdSchema,
  sport_id: objectIdSchema,
  event_start_at: z.coerce.date(),
  event_end_at: z.coerce.date(),
  images: z.array(z.string()).optional(),
  links: eventLinksSchema.optional(),
});

export const driverLeaderboardSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  sport_id: objectIdSchema,
  driver_id: objectIdSchema,
  team_id: optionalObjectIdSchema,
  stats: leaderboardStatsSchema,
});

export const teamLeaderboardSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  sport_id: objectIdSchema,
  team_id: objectIdSchema,
  stats: leaderboardStatsSchema,
});
