# Circuit Nation — Data & API Guidelines

> Stack: Next.js 16 API Routes · Mongoose v9 · MongoDB
> Collections: `events` · `drivers` · `sports` · `teams`

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Database Connection](#database-connection)
4. [Mongoose Models](#mongoose-models)
5. [API Route Structure](#api-route-structure)
6. [API Route Conventions](#api-route-conventions)
7. [Admin API Client](#admin-api-client)
8. [TanStack Query Keys & Hooks](#tanstack-query-keys--hooks)
9. [Championship Leaderboard](#championship-leaderboard)
10. [Zod Validators](#zod-validators)
11. [TypeScript Types](#typescript-types)

---

## Overview

Circuit Nation data lives in MongoDB and is accessed via **Next.js API Routes** (`/app/api/circuit-nation/`). These routes serve as the backend for both:

- **This admin dashboard** — full CRUD for all collections.
- **The Circuit Nation client website** — read-oriented endpoints that the CN website consumes.

The admin dashboard calls its own API routes. Never call the MongoDB driver or Mongoose directly from a client component — always go through the API layer.

---

## Environment Variables

All sensitive configuration is stored in `.env.local`. **No environment variable name or value is ever shown in the UI, logs visible to the user, or error messages.**

Only variables prefixed with `NEXT_PUBLIC_` are available in the browser. Circuit Nation database credentials and API secrets must **never** use this prefix.

---

## Database Connection

```tsx
// lib/circuit-nation/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables.");
}

// Cache the connection across hot-reloads in development
const cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } =
  (global as any).__mongoose ?? { conn: null, promise: null };

(global as any).__mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: process.env.CN_DB_NAME,
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

### Championship Leaderboard Model

Leaderboard entries are stored separately — not computed on the fly — to avoid expensive aggregations on every page load. They are updated when event results are recorded.

```ts
// lib/circuit-nation/models/championship-entry.ts
import { Schema, model, models, Document, Types } from "mongoose";

export type ChampionshipType = "driver" | "team";

export interface IChampionshipEntry extends Document {
  _id: Types.ObjectId;
  type: ChampionshipType;
  year: number;
  sport: Types.ObjectId;
  entity: Types.ObjectId;   // ref to Driver or Team depending on type
  points: number;
  position: number;
  wins: number;
  podiums: number;
  updatedAt: Date;
}

const ChampionshipEntrySchema = new Schema<IChampionshipEntry>(
  {
    type:     { type: String, enum: ["driver", "team"], required: true },
    year:     { type: Number, required: true },
    sport:    { type: Schema.Types.ObjectId, ref: "Sport", required: true },
    entity:   { type: Schema.Types.ObjectId, required: true, refPath: "entityModel" },
    points:   { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    wins:     { type: Number, default: 0 },
    podiums:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

ChampionshipEntrySchema.index({ type: 1, year: 1, sport: 1 }, { unique: false });
ChampionshipEntrySchema.index({ type: 1, year: 1, sport: 1, entity: 1 }, { unique: true });

export const ChampionshipEntry = models.ChampionshipEntry
  ?? model<IChampionshipEntry>("ChampionshipEntry", ChampionshipEntrySchema);
```

---

## API Route Structure

```
/app/api/circuit-nation/
  /sports
    route.ts          ← GET (list), POST (create)
    /[id]
      route.ts        ← GET, PATCH, DELETE

  /events
    route.ts          ← GET (list, with ?year= ?sport= filters), POST
    /[id]
      route.ts        ← GET, PATCH, DELETE

  /drivers
    route.ts          ← GET, POST
    /[id]
      route.ts        ← GET, PATCH, DELETE

  /teams
    route.ts          ← GET, POST
    /[id]
      route.ts        ← GET, PATCH, DELETE

  /championship
    /drivers
      route.ts        ← GET (leaderboard by ?year= &sport=), POST/PATCH (upsert entry)
    /teams
      route.ts        ← GET, POST/PATCH
```

---

## API Route Conventions

### Route Handler Template

Every route handler follows this exact pattern — connect DB, handle each method, always return typed responses, never leak internal errors.

```ts
// app/api/circuit-nation/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/circuit-nation/db";
import { Event } from "@/lib/circuit-nation/models/event";
import { eventSchema } from "@/lib/circuit-nation/validators";
import { z } from "zod/v4";

// ── GET /api/circuit-nation/events ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const year  = searchParams.get("year");
    const sport = searchParams.get("sport");

    const filter: Record<string, unknown> = {};
    if (year)  filter.year  = parseInt(year);
    if (sport) filter.sport = sport;

    const events = await Event.find(filter)
      .populate("sport", "name slug")
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error("[events:GET]", error);
    return NextResponse.json({ error: "Failed to fetch events." }, { status: 500 });
  }
}

// ── POST /api/circuit-nation/events ────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data.", issues: parsed.error.issues }, { status: 400 });
    }

    const event = await Event.create(parsed.data);
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    console.error("[events:POST]", error);
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
  }
}
```

```ts
// app/api/circuit-nation/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/circuit-nation/db";
import { Event } from "@/lib/circuit-nation/models/event";
import { eventSchema } from "@/lib/circuit-nation/validators";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const event = await Event.findById(params.id).populate("sport").lean();
    if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ data: event });
  } catch {
    return NextResponse.json({ error: "Failed to fetch event." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = eventSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }
    const event = await Event.findByIdAndUpdate(params.id, parsed.data, { new: true }).lean();
    if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ data: event });
  } catch {
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const event = await Event.findByIdAndDelete(params.id);
    if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Failed to delete event." }, { status: 500 });
  }
}
```

### Response Shape Contract

All API responses follow a consistent envelope. The admin client and CN website both rely on this shape.

```ts
// Success
{ "data": <payload> }

// Error
{ "error": "<human-readable message>" }

// Validation error
{ "error": "Invalid data.", "issues": [...] }
```

Never return raw Mongoose errors, stack traces, or MongoDB messages to the client.

---

## Admin API Client

One typed API client per domain. All fetch calls live here — never scattered in components or hooks.

```ts
// lib/circuit-nation/api.ts
import type { Event, Driver, Team, Sport, ChampionshipEntry } from "./types";

const BASE = "/api/circuit-nation";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const json = await res.json();

  if (!res.ok) {
    // Throw the server's human-readable message — never the raw response
    throw new Error(json.error ?? "An unexpected error occurred.");
  }

  return json.data as T;
}

export const cnApi = {
  events: {
    list:   (filters?: { year?: number; sport?: string }) => {
      const params = new URLSearchParams();
      if (filters?.year)  params.set("year", String(filters.year));
      if (filters?.sport) params.set("sport", filters.sport);
      return request<Event[]>(`/events?${params}`);
    },
    get:    (id: string) => request<Event>(`/events/${id}`),
    create: (data: Partial<Event>) =>
      request<Event>("/events", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Event>) =>
      request<Event>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/events/${id}`, { method: "DELETE" }),
  },

  drivers: {
    list:   (filters?: { sport?: string; team?: string }) =>
      request<Driver[]>(`/drivers?${new URLSearchParams(filters as any)}`),
    get:    (id: string) => request<Driver>(`/drivers/${id}`),
    create: (data: Partial<Driver>) =>
      request<Driver>("/drivers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Driver>) =>
      request<Driver>(`/drivers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/drivers/${id}`, { method: "DELETE" }),
  },

  teams: {
    list:   () => request<Team[]>("/teams"),
    get:    (id: string) => request<Team>(`/teams/${id}`),
    create: (data: Partial<Team>) =>
      request<Team>("/teams", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Team>) =>
      request<Team>(`/teams/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/teams/${id}`, { method: "DELETE" }),
  },

  sports: {
    list:   () => request<Sport[]>("/sports"),
    get:    (id: string) => request<Sport>(`/sports/${id}`),
    create: (data: Partial<Sport>) =>
      request<Sport>("/sports", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Sport>) =>
      request<Sport>(`/sports/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/sports/${id}`, { method: "DELETE" }),
  },

  championship: {
    drivers: (year: number, sportId: string) =>
      request<ChampionshipEntry[]>(`/championship/drivers?year=${year}&sport=${sportId}`),
    teams: (year: number, sportId: string) =>
      request<ChampionshipEntry[]>(`/championship/teams?year=${year}&sport=${sportId}`),
    upsertDriver: (data: Partial<ChampionshipEntry>) =>
      request<ChampionshipEntry>("/championship/drivers", { method: "POST", body: JSON.stringify(data) }),
    upsertTeam: (data: Partial<ChampionshipEntry>) =>
      request<ChampionshipEntry>("/championship/teams", { method: "POST", body: JSON.stringify(data) }),
  },
};
```

---

## TanStack Query Keys & Hooks

```ts
// lib/circuit-nation/queries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cnApi } from "./api";

// ── Query Key Factory ──────────────────────────────────────────────────────

export const cnKeys = {
  all: ["cn"] as const,
  events: {
    all:    () => [...cnKeys.all, "events"] as const,
    list:   (f?: object) => [...cnKeys.events.all(), "list", f] as const,
    detail: (id: string) => [...cnKeys.events.all(), id] as const,
  },
  drivers: {
    all:          () => [...cnKeys.all, "drivers"] as const,
    list:         (f?: object) => [...cnKeys.drivers.all(), "list", f] as const,
    detail:       (id: string) => [...cnKeys.drivers.all(), id] as const,
    championship: (year: number, sport: string) =>
      [...cnKeys.drivers.all(), "championship", year, sport] as const,
  },
  teams: {
    all:          () => [...cnKeys.all, "teams"] as const,
    list:         () => [...cnKeys.teams.all(), "list"] as const,
    detail:       (id: string) => [...cnKeys.teams.all(), id] as const,
    championship: (year: number, sport: string) =>
      [...cnKeys.teams.all(), "championship", year, sport] as const,
  },
  sports: {
    all:  () => [...cnKeys.all, "sports"] as const,
    list: () => [...cnKeys.sports.all(), "list"] as const,
  },
};

// ── Events ─────────────────────────────────────────────────────────────────

export const useEvents = (filters?: { year?: number; sport?: string }) =>
  useQuery({ queryKey: cnKeys.events.list(filters), queryFn: () => cnApi.events.list(filters) });

export const useEvent = (id: string) =>
  useQuery({ queryKey: cnKeys.events.detail(id), queryFn: () => cnApi.events.get(id), enabled: !!id });

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cnApi.events.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: cnKeys.events.all() }),
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof cnApi.events.update>[1] }) =>
      cnApi.events.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: cnKeys.events.all() });
      qc.invalidateQueries({ queryKey: cnKeys.events.detail(id) });
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cnApi.events.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: cnKeys.events.all() }),
  });
};

// ── Championship ───────────────────────────────────────────────────────────

export const useDriverChampionship = (year: number, sportId: string) =>
  useQuery({
    queryKey: cnKeys.drivers.championship(year, sportId),
    queryFn: () => cnApi.championship.drivers(year, sportId),
    enabled: !!sportId && !!year,
  });

export const useTeamChampionship = (year: number, sportId: string) =>
  useQuery({
    queryKey: cnKeys.teams.championship(year, sportId),
    queryFn: () => cnApi.championship.teams(year, sportId),
    enabled: !!sportId && !!year,
  });

// (Repeat the same pattern for drivers, teams, sports)
```

---

## Championship Leaderboard

### Leaderboard API Route

```ts
// app/api/circuit-nation/championship/drivers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/circuit-nation/db";
import { ChampionshipEntry } from "@/lib/circuit-nation/models/championship-entry";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const year    = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const sportId = searchParams.get("sport");

    if (!sportId) return NextResponse.json({ error: "Sport is required." }, { status: 400 });

    const entries = await ChampionshipEntry.find({ type: "driver", year, sport: sportId })
      .populate("entity", "firstName lastName number team")
      .sort({ points: -1 })
      .lean();

    return NextResponse.json({ data: entries });
  } catch {
    return NextResponse.json({ error: "Failed to load standings." }, { status: 500 });
  }
}

// Upsert a driver's championship entry (used when recording event results)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { type, year, sport, entity, ...scores } = body;

    const entry = await ChampionshipEntry.findOneAndUpdate(
      { type: "driver", year, sport, entity },
      { $set: scores },
      { upsert: true, new: true }
    );

    return NextResponse.json({ data: entry });
  } catch {
    return NextResponse.json({ error: "Failed to update standings." }, { status: 500 });
  }
}
```

### Leaderboard UI Component

```tsx
// components/circuit-nation/championship/leaderboard-table.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import type { ChampionshipEntry } from "@/lib/circuit-nation/types";

const driverColumns: ColumnDef<ChampionshipEntry>[] = [
  { accessorKey: "position", header: "Pos", cell: ({ getValue }) => `P${getValue()}` },
  {
    id: "name",
    header: "Driver",
    cell: ({ row }) => {
      const d = row.original.entity as any;
      return `${d.firstName} ${d.lastName}`;
    },
  },
  { accessorKey: "points",  header: "Points" },
  { accessorKey: "wins",    header: "Wins" },
  { accessorKey: "podiums", header: "Podiums" },
];

interface LeaderboardTableProps {
  data: ChampionshipEntry[];
}

export function DriverLeaderboardTable({ data }: LeaderboardTableProps) {
  return <DataTable columns={driverColumns} data={data} />;
}
```

---

## Zod Validators

```ts
// lib/circuit-nation/validators.ts
import { z } from "zod/v4";

export const sportSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
});

export const eventSchema = z.object({
  name:     z.string().min(1, "Event name is required").max(200),
  sport:    z.string().min(1, "Sport is required"),
  date:     z.coerce.date(),
  endDate:  z.coerce.date().optional(),
  location: z.string().optional(),
  status:   z.enum(["upcoming", "ongoing", "completed", "cancelled"]).default("upcoming"),
  year:     z.number().int().min(2000).max(2100),
});

export const teamSchema = z.object({
  name:     z.string().min(1).max(150),
  slug:     z.string().min(1).regex(/^[a-z0-9-]+$/),
  sport:    z.string().min(1),
  logoUrl:  z.string().url().optional(),
  country:  z.string().optional(),
  isActive: z.boolean().default(true),
});

export const driverSchema = z.object({
  firstName:   z.string().min(1).max(100),
  lastName:    z.string().min(1).max(100),
  nationality: z.string().optional(),
  team:        z.string().min(1, "Team is required"),
  sport:       z.string().min(1, "Sport is required"),
  number:      z.number().int().min(0).max(999).optional(),
  imageUrl:    z.string().url().optional(),
  isActive:    z.boolean().default(true),
});

export const championshipEntrySchema = z.object({
  type:     z.enum(["driver", "team"]),
  year:     z.number().int(),
  sport:    z.string().min(1),
  entity:   z.string().min(1),
  points:   z.number().int().min(0).default(0),
  position: z.number().int().min(1).default(1),
  wins:     z.number().int().min(0).default(0),
  podiums:  z.number().int().min(0).default(0),
});
```