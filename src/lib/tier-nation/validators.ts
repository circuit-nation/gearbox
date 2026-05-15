import { z } from "zod";

export const tierConfigEntrySchema = z.object({
  value: z.number().int().min(1).max(7),
  label: z.string().min(1),
});

export const tiersConfigSchema = z.object({
  tiers: z.array(tierConfigEntrySchema).min(1),
});

export const createTierListSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  tiersConfig: tiersConfigSchema,
  isLocked: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
});

export const updateTierListSchema = createTierListSchema.partial();

export const adminEntityInputSchema = z.object({
  name: z.string().min(1),
  team: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
});

export const adminEntitiesBodySchema = z.object({
  entities: z.array(adminEntityInputSchema).min(1),
});

export const updateEntitySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  team: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().nullable().optional(),
});

export const reorderListEntitiesSchema = z.object({
  order: z.array(
    z.object({
      entityId: z.string().min(1),
      sortOrder: z.number().int().min(0),
    })
  ),
});
