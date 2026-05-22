export type TierConfigEntry = {
  value: number;
  label: string;
};

export type TiersConfig = {
  tiers: TierConfigEntry[];
};

export type CreateTierListRequest = {
  name: string;
  description?: string;
  coverImage?: string;
  tiersConfig: TiersConfig;
  isLocked?: boolean;
  isVisible?: boolean;
  startTime?: string | null;
  endTime?: string | null;
};

export type TierListResponse = {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  tiersConfig: TiersConfig;
  isLocked: boolean;
  isVisible: boolean;
  startTime?: string | null;
  endTime?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

/** PATCH /admin/lists/:id — all fields optional. */
export type UpdateTierListRequest = Partial<{
  name: string;
  description: string;
  coverImage: string;
  tiersConfig: TiersConfig;
  isLocked: boolean;
  isVisible: boolean;
  startTime: string | null;
  endTime: string | null;
}>;

export type AdminEntityInput = {
  name: string;
  team?: string;
  tags?: string[];
  imageUrl?: string;
  description?: string;
};

export type AdminEntitiesBody = {
  entities: AdminEntityInput[];
};

export type LinkEntitiesToListBody = {
  entityIds: string[];
};

export type AdminAddToListBody = AdminEntitiesBody | LinkEntitiesToListBody;

export type MessageResponse = {
  message: string;
  skippedEntityIds?: string[];
};

/** PATCH /admin/entities/:id — all fields optional. */
export type UpdateEntityRequest = Partial<{
  name: string;
  description: string;
  team: string;
  tags: string[];
  imageUrl: string | null;
}>;

/** PATCH /admin/entities/:id response. */
export type EntityAdminResponse = {
  id: string;
  name: string;
  description?: string;
  team?: string;
  tags?: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

/** PATCH /admin/lists/:listId/entities/order */
export type ReorderListEntitiesRequest = {
  order: { entityId: string; sortOrder: number }[];
};

export type ErrorResponse = {
  error: string;
};

/** Public `GET /lists` item (fields may be partial vs full list). */
export type PublicTierListSummary = {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  tiersConfig?: TiersConfig;
  isLocked?: boolean;
  isVisible?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PublicListsResponse = {
  lists: PublicTierListSummary[];
  total?: number;
};

/** Entity as returned on `GET /lists/:id` and `GET /admin/entities`. */
export type PublicTierListEntity = {
  id: string;
  name: string;
  description?: string;
  team?: string;
  tags?: string[];
  imageUrl?: string;
};

export type AdminEntitiesListResponse = {
  entities: PublicTierListEntity[];
  total: number;
};

/** Public `GET /lists/:id` — list plus nested entities. */
export type PublicListDetail = PublicTierListSummary & {
  entities?: PublicTierListEntity[];
};

export const DEFAULT_TIERS_CONFIG: TiersConfig = {
  tiers: [
    { value: 1, label: "S" },
    { value: 2, label: "A" },
    { value: 3, label: "B" },
    { value: 4, label: "C" },
    { value: 5, label: "D" },
    { value: 6, label: "E" },
    { value: 7, label: "F" },
  ],
};
