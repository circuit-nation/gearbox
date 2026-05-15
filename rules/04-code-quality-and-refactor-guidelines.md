# Code Quality, Refactor & Testing Guidelines

> Tools: TypeScript 5 · ESLint · Prettier · Vitest · React Testing Library · Playwright

---

## Table of Contents

1. [Why Refactor](#why-refactor)
2. [Code Formatter Setup](#code-formatter-setup)
3. [ESLint Setup](#eslint-setup)
4. [Refactor Priorities](#refactor-priorities)
5. [Refactor Playbook — Step by Step](#refactor-playbook--step-by-step)
6. [Code Quality Rules](#code-quality-rules)
7. [File & Function Length Limits](#file--function-length-limits)
8. [Unit Testing with Vitest](#unit-testing-with-vitest)
9. [Integration Testing with React Testing Library](#integration-testing-with-react-testing-library)
10. [E2E Testing with Playwright](#e2e-testing-with-playwright)
11. [Testing Conventions](#testing-conventions)
12. [Git Hygiene](#git-hygiene)

---

## Why Refactor

Poorly distributed code leads to:

- **Duplicated logic** — the same fetch call or utility written in 3 places, each slightly different.
- **Untraceable bugs** — when a fix in one place doesn't fix it everywhere.
- **Impossible testing** — components that do too much can't be unit-tested cleanly.
- **Slow onboarding** — no one knows where anything lives.

The goal of this refactor is not to rewrite — it's to **reorganize, consolidate, and enforce boundaries** so the codebase is predictable.

---

## Code Formatter Setup

### Install Prettier

```bash
pnpm add -D prettier prettier-plugin-tailwindcss
```

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindConfig": "./tailwind.config.ts"
}
```

### `.prettierignore`

```
node_modules
.next
dist
public
*.md
```

### Add Format Scripts to `package.json`

```json
"scripts": {
  "dev":     "next dev",
  "build":   "next build",
  "start":   "next start",
  "format":  "prettier --write .",
  "format:check": "prettier --check .",
  "lint":    "next lint",
  "test":    "vitest run",
  "test:watch": "vitest",
  "test:ui":  "vitest --ui",
  "test:e2e": "playwright test"
}
```

Run `pnpm format` before every commit. Add it to a pre-commit hook (see Git Hygiene below).

---

## ESLint Setup

Next.js 16 ships with ESLint config. Extend it with these additional rules.

### `eslint.config.mjs`

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // ── Correctness ────────────────────────────────────────────────
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "no-debugger": "error",
      "no-unused-vars": "off", // handled by TypeScript
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",

      // ── React ──────────────────────────────────────────────────────
      "react/self-closing-comp": "warn",
      "react/jsx-no-useless-fragment": "warn",

      // ── Imports ────────────────────────────────────────────────────
      "import/no-duplicates": "error",

      // ── Code style ─────────────────────────────────────────────────
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "warn",
    },
  },
  {
    // Allow console.log in test files
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: { "no-console": "off" },
  },
];
```

---

## Refactor Priorities

Address in this order — high impact, low risk first.

### Priority 1 — Consolidate API Calls

**Problem:** `fetch("/api/circuit-nation/events")` is called directly in multiple components with no shared error handling.

**Fix:** Move every API call into `lib/circuit-nation/api.ts` or `lib/tier-nation/api.ts`. Components never call `fetch` directly.

```tsx
// ❌ Before — fetch in component
useEffect(() => {
  fetch("/api/circuit-nation/events")
    .then((r) => r.json())
    .then(setEvents);
}, []);

// ✅ After — typed hook from query layer
const { data: events } = useEvents();
```

### Priority 2 — Remove Duplicate State

**Problem:** Multiple components each maintain their own loading/error state for the same data.

**Fix:** TanStack Query owns all server state. Components only use query hooks — no manual `useState` for data that comes from an API.

```tsx
// ❌ Before
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// ✅ After
const { data: events, isLoading, isError } = useEvents();
```

### Priority 3 — Extract Inline Column Definitions

**Problem:** Column definitions defined inside page/component render functions — re-created on every render.

**Fix:** Define column arrays at module scope or in a dedicated `*-columns.tsx` file. They are static data.

```tsx
// ❌ Before — inside the component
function EventsPage() {
  const columns = [{ accessorKey: "name", header: "Name" }]; // new array every render
  ...
}

// ✅ After — outside or in a separate file
const columns: ColumnDef<Event>[] = [{ accessorKey: "name", header: "Name" }];

function EventsPage() { ... }
```

### Priority 4 — Centralize Form Schemas

**Problem:** Zod schemas defined inline in form components, duplicated across create and edit forms.

**Fix:** All schemas live in `lib/*/validators.ts`. Forms import and share them.

### Priority 5 — Replace Magic Strings

**Problem:** Status values, route paths, and query params hardcoded as strings throughout the codebase.

**Fix:** Use constants or enums.

```ts
// lib/constants.ts
export const EVENT_STATUS = {
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];
```

---

## Refactor Playbook — Step by Step

Use this process for each feature/section of the codebase:

```
1. READ the existing code top to bottom before touching anything.
2. IDENTIFY all the things it does (fetching, transforming, rendering, handling events).
3. SEPARATE concerns into: types → validators → api client → query hooks → UI components.
4. MOVE code — don't rewrite unless the old logic is clearly wrong.
5. DELETE the original after verifying the new version works.
6. WRITE a test for the moved logic before deleting the original.
7. COMMIT each concern separately (one commit per layer moved).
```

### Example — Refactoring a Bloated Page Component

```tsx
// ❌ Before — everything in one place
"use client";
export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetch("/api/circuit-nation/drivers")
      .then((r) => r.json())
      .then((d) => {
        setDrivers(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { accessorKey: "firstName", header: "First Name" },
    { accessorKey: "lastName", header: "Last Name" },
    {
      id: "actions",
      cell: ({ row }) => (
        <button
          onClick={() => {
            fetch(`/api/circuit-nation/drivers/${row.original._id}`, { method: "DELETE" }).then(
              () => setDrivers((prev) => prev.filter((d) => d._id !== row.original._id))
            );
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  if (loading) return <div>Loading...</div>;
  return <DataTable columns={columns} data={drivers} />;
}
```

```tsx
// ✅ After — properly layered

// 1. lib/circuit-nation/api.ts — API call lives here
// 2. lib/circuit-nation/queries.ts — useDrivers, useDeleteDriver hooks
// 3. components/circuit-nation/drivers/drivers-columns.tsx — column definitions
// 4. app/(dashboard)/circuit-nation/drivers/page.tsx — thin page

"use client";
import { useDrivers, useDeleteDriver } from "@/lib/circuit-nation/queries";
import { driversColumns } from "@/components/circuit-nation/drivers/drivers-columns";
import { DataTable } from "@/components/shared/data-table";
import { SkeletonTable } from "@/components/shared/skeleton-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import { useState } from "react";
import type { Driver } from "@/lib/circuit-nation/types";

export default function DriversPage() {
  const { data: drivers, isLoading } = useDrivers();
  const deleteDriver = useDeleteDriver();
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

  const columns = driversColumns({ onDelete: setDeleteTarget });

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDriver.mutateAsync(deleteTarget._id);
      toast.success("Driver removed.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to remove driver. Please try again.");
    }
  }

  return (
    <>
      <PageHeader title="Drivers" />
      {isLoading ? (
        <SkeletonTable rows={8} columns={5} />
      ) : (
        <DataTable columns={columns} data={drivers ?? []} searchKey="lastName" />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Remove driver?"
        onConfirm={handleDelete}
        loading={deleteDriver.isPending}
      />
    </>
  );
}
```

---

## Code Quality Rules

### Naming

| Thing              | Convention                  | Example                                         |
| ------------------ | --------------------------- | ----------------------------------------------- |
| React components   | kebab-case                  | `events-table`, `create-driver-dialog`          |
| Hooks              | camelCase with `use` prefix | `useEvents`, `useDeleteDriver`                  |
| Types/interfaces   | PascalCase                  | `Driver`, `ChampionshipEntry`                   |
| Constants          | SCREAMING_SNAKE_CASE        | `EVENT_STATUS`, `BASE_URL`                      |
| Files (components) | kebab-case                  | `events-columns.tsx`, `create-event-dialog.tsx` |
| Files (utilities)  | kebab-case                  | `api.ts`, `validators.ts`, `badge-variants.ts`  |

### Function Rules

- Functions do **one thing**. If you need to write "and" to describe what a function does, split it.
- Keep functions under **40 lines**. Longer = needs splitting.
- No more than **3 parameters**. Use an options object if you need more.

```tsx
// ❌ Too many parameters
function createEntry(type, year, sport, entity, points, wins, podiums) { ... }

// ✅ Options object
function createEntry(options: ChampionshipEntryOptions) { ... }
```

### No Nested Ternaries

```tsx
// ❌ Unreadable
const label = isLoading ? "Loading..." : isError ? "Error" : data ? data.name : "Empty";

// ✅ Readable
function getLabel() {
  if (isLoading) return "Loading...";
  if (isError) return "Error";
  if (data) return data.name;
  return "Empty";
}
const label = getLabel();
```

### Consistent Exports

- Use **named exports** for components, hooks, and utilities.
- Use **default exports** only for Next.js pages, layouts, and route handlers (required by the framework).

```tsx
// ✅ Named export for reusable components
export function DataTable(...) { ... }
export function PageHeader(...) { ... }

// ✅ Default export only for pages
export default function EventsPage() { ... }
```

---

## File & Function Length Limits

| File type              | Max lines | Action if exceeded              |
| ---------------------- | --------- | ------------------------------- |
| Page component         | 100       | Extract components and handlers |
| Shared component       | 200       | Split into sub-components       |
| Column definition file | 150       | Split by resource               |
| API client (`api.ts`)  | 200       | Split by resource               |
| Query hooks file       | 250       | Split by resource               |
| Validators file        | 150       | Split by domain                 |
| Route handler          | 80        | Extract service functions       |

---

## Unit Testing with Vitest

### Install

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
```

### `tests/setup.ts`

```ts
import "@testing-library/jest-dom";
```

### What to Unit Test

- **Validators** — Zod schemas with valid and invalid data.
- **Utility functions** — `cn()`, date formatters, badge variant lookups.
- **API client** — mock `fetch` and verify correct URLs, methods, and error handling.
- **Custom hooks** — wrap with `renderHook` from RTL.

### Example — Testing a Validator

```ts
// lib/circuit-nation/__tests__/validators.test.ts
import { describe, it, expect } from "vitest";
import { eventSchema } from "../validators";

describe("eventSchema", () => {
  it("accepts valid event data", () => {
    const result = eventSchema.safeParse({
      name: "Grand Prix Monaco",
      sport: "6847fa000000000000000001",
      date: "2025-05-01",
      year: 2025,
      status: "upcoming",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = eventSchema.safeParse({ sport: "id", date: "2025-05-01", year: 2025 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("name");
  });

  it("rejects invalid status", () => {
    const result = eventSchema.safeParse({
      name: "Test",
      sport: "id",
      date: "2025-05-01",
      year: 2025,
      status: "unknown",
    });
    expect(result.success).toBe(false);
  });
});
```

### Example — Testing the API Client

```ts
// lib/circuit-nation/__tests__/api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { cnApi } from "../api";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("cnApi.events", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the correct endpoint for list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await cnApi.events.list();
    expect(mockFetch).toHaveBeenCalledWith("/api/circuit-nation/events?", expect.any(Object));
  });

  it("throws a user-friendly error on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed to fetch events." }),
    });

    await expect(cnApi.events.list()).rejects.toThrow("Failed to fetch events.");
  });
});
```

### Example — Testing a Utility

```ts
// lib/__tests__/badge-variants.test.ts
import { describe, it, expect } from "vitest";
import { STATUS_VARIANTS } from "../badge-variants";

describe("STATUS_VARIANTS", () => {
  it("has a variant for every expected status", () => {
    const expected = ["active", "inactive", "pending", "cancelled"];
    expected.forEach((status) => {
      expect(STATUS_VARIANTS).toHaveProperty(status);
    });
  });
});
```

---

## Integration Testing with React Testing Library

Integration tests render full components with all their dependencies (mocked at the network layer).

### Test File Location

Co-locate tests with the components they test:

```
/components/shared/__tests__/data-table.test.tsx
/components/circuit-nation/events/__tests__/events-page.test.tsx
/lib/circuit-nation/__tests__/validators.test.ts
```

### Mocking TanStack Query in Tests

```tsx
// tests/utils/wrapper.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

export function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}
```

### Example — DataTable Integration Test

```tsx
// components/shared/__tests__/data-table.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "../data-table";
import { ColumnDef } from "@tanstack/react-table";
import { describe, it, expect } from "vitest";

interface Row {
  id: string;
  name: string;
}

const columns: ColumnDef<Row>[] = [{ accessorKey: "name", header: "Name" }];

const data: Row[] = [
  { id: "1", name: "Monaco Grand Prix" },
  { id: "2", name: "Silverstone Circuit" },
];

describe("DataTable", () => {
  it("renders all rows", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText("Monaco Grand Prix")).toBeInTheDocument();
    expect(screen.getByText("Silverstone Circuit")).toBeInTheDocument();
  });

  it("filters rows by search", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} searchKey="name" />);

    await user.type(screen.getByPlaceholderText("Search..."), "Monaco");
    expect(screen.getByText("Monaco Grand Prix")).toBeInTheDocument();
    expect(screen.queryByText("Silverstone Circuit")).not.toBeInTheDocument();
  });

  it("shows empty message when no results", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} searchKey="name" />);
    await user.type(screen.getByPlaceholderText("Search..."), "zzz");
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });
});
```

### Example — Form Component Test

```tsx
// components/circuit-nation/events/__tests__/create-event-dialog.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createWrapper } from "@/tests/utils/wrapper";
import { CreateEventDialog } from "../create-event-dialog";
import * as queries from "@/lib/circuit-nation/queries";

describe("CreateEventDialog", () => {
  const onOpenChange = vi.fn();
  const mockCreate = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.spyOn(queries, "useCreateEvent").mockReturnValue({
      mutateAsync: mockCreate,
      isPending: false,
    } as any);
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    render(<CreateEventDialog open={true} onOpenChange={onOpenChange} />, {
      wrapper: createWrapper(),
    });

    await user.type(screen.getByLabelText("Event Name"), "Monaco Grand Prix");
    await user.click(screen.getByRole("button", { name: "Create Event" }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Monaco Grand Prix" })
      );
    });
  });

  it("shows validation error for empty name", async () => {
    const user = userEvent.setup();
    render(<CreateEventDialog open={true} onOpenChange={onOpenChange} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole("button", { name: "Create Event" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
  });
});
```

---

## E2E Testing with Playwright

### Install

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

### `playwright.config.ts`

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Example E2E Test

```ts
// e2e/circuit-nation/events.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Events page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/circuit-nation/events");
  });

  test("displays the events table", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("opens create dialog on button click", async ({ page }) => {
    await page.getByRole("button", { name: "New Event" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Create Event")).toBeVisible();
  });

  test("filters table by search input", async ({ page }) => {
    const input = page.getByPlaceholder("Search events...");
    await input.fill("Monaco");
    await expect(page.getByRole("row")).not.toHaveCount(1); // header only = no results
  });
});
```

---

## Testing Conventions

| Rule                                                                    | Rationale                             |
| ----------------------------------------------------------------------- | ------------------------------------- |
| Test behaviour, not implementation                                      | Tests survive refactors               |
| Use `getByRole` and `getByLabelText` over `getByTestId`                 | Mirrors accessibility, more resilient |
| One `describe` block per component                                      | Keeps failures easy to locate         |
| Mock at the network boundary, not inside components                     | Tests actual component logic          |
| Never test implementation details (state variables, internal functions) | Brittle                               |
| Test happy path + at least one error path per feature                   | Minimum meaningful coverage           |
| Don't mock what you own — mock what you don't (fetch, env vars)         | Avoids false confidence               |

---

## Git Hygiene

### Commit Message Format

```
type(scope): short description

feat(cn): add teams championship leaderboard
fix(tn): handle 404 gracefully on entity delete
refactor(shared): extract column definitions from page components
test(cn): add validator unit tests for event schema
chore: add prettier and eslint configuration
```

Types: `feat` · `fix` · `refactor` · `test` · `chore` · `docs` · `perf`

### Pre-commit Hook with `simple-git-hooks` + `lint-staged`

```bash
pnpm add -D simple-git-hooks lint-staged
```

**`package.json`** additions:

```json
"simple-git-hooks": {
  "pre-commit": "pnpm lint-staged"
},
"lint-staged": {
  "*.{ts,tsx}": [
    "prettier --write",
    "eslint --fix",
    "vitest related --run"
  ],
  "*.{json,css,md}": ["prettier --write"]
}
```

```bash
pnpm simple-git-hooks  # run once to install hooks
```

This ensures every commit is formatted, lint-clean, and passes related tests before it ever reaches the remote.

### Branch Strategy

```
main          ← production-ready only
└── dev       ← integration branch
    ├── feat/cn-teams-championship
    ├── fix/tn-entity-delete-error
    └── refactor/consolidate-api-clients
```

Never commit directly to `main` or `dev`. Always open a PR, even when working alone — the diff review catches issues before they're merged.
