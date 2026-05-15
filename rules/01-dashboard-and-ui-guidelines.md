# Dashboard & UI Guidelines

> Stack: Next.js 16 · React 19 · TanStack Query v5 · TanStack Table v8 · Tailwind v4 · shadcn/ui · Lucide React

---

## Table of Contents

1. [Dashboard Architecture](#dashboard-architecture)
2. [Design Principles](#design-principles)
3. [Folder Structure](#folder-structure)
4. [Layout & Navigation](#layout--navigation)
5. [TanStack Query — Data Fetching](#tanstack-query--data-fetching)
6. [TanStack Table — Data Tables](#tanstack-table--data-tables)
7. [shadcn/ui Components](#shadcnui-components)
8. [Tailwind v4 Conventions](#tailwind-v4-conventions)
9. [Forms with React Hook Form + Zod](#forms-with-react-hook-form--zod)
10. [Notifications & Feedback](#notifications--feedback)
11. [Error & Loading States](#error--loading-states)

---

## Dashboard Architecture

The admin dashboard manages two completely separate applications — **Circuit Nation** and **Tier Nation**. These must be treated as isolated domains within the same shell.

```
Admin Shell (Layout, Auth, Nav)
├── Circuit Nation Domain
│   ├── Events
│   ├── Drivers
│   ├── Sports
│   └── Teams
└── Tier Nation Domain
    ├── Entities
    └── Lists
```

**Golden rules:**

- Each domain has its own API client, hooks, types, and components — they never share data-fetching logic.
- The shell (sidebar, topbar, auth) is shared infrastructure.
- No domain-specific logic bleeds into the shell.
- Admin users never see raw API URLs, environment variable names, or internal identifiers in any UI text.

---

## Design Principles

### Clarity Over Information Density

- Show only what the admin needs to act on — not everything that exists in the database.
- Use progressive disclosure: summary → detail on demand.
- Tables show the most actionable columns first; hide auxiliary data behind an expandable row or a sheet/dialog.

### Consistent Visual Language

- All destructive actions (delete, deactivate) use `variant="destructive"`.
- All primary CTA buttons are `variant="default"`.
- Secondary/cancel actions are `variant="outline"` or `variant="ghost"`.
- Status badges follow a fixed color contract — never use ad hoc colors inline.

```tsx
// lib/badge-variants.ts — single source of truth for status colors
export const STATUS_VARIANTS = {
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  inactive: "bg-slate-500/15 text-slate-600 border-slate-300",
  pending: "bg-amber-500/15 text-amber-700 border-amber-300",
  cancelled: "bg-red-500/15 text-red-700 border-red-300",
} as const;
```

### No Technical Jargon in the UI

- ❌ `Error 401: Unauthorized from https://api.tiernation.io/v2/entities`
- ✅ `You don't have permission to view this. Please contact support.`
- ❌ `MongoDB ObjectId: 6847fa...`
- ✅ Show the human-readable name. Use the ID internally only.
- All `console.error` calls stay in service files — never surface raw errors to users.

---

## Folder Structure

```
/app
  /(auth)
    /login
      page.tsx
  /(dashboard)
    layout.tsx                    ← Shell: sidebar + topbar
    /circuit-nation
      layout.tsx                  ← CN sub-layout (breadcrumbs, tab nav)
      /events
        page.tsx                  ← List page
        /[id]
          page.tsx                ← Detail/edit page
      /drivers/page.tsx
      /sports/page.tsx
      /teams/page.tsx
    /tier-nation
      /entities/page.tsx
      /lists/page.tsx

/components
  /ui                             ← shadcn primitives (auto-generated, DO NOT edit)
  /shared                         ← Reusable cross-domain components
    data-table.tsx
    page-header.tsx
    status-badge.tsx
    confirm-dialog.tsx
    empty-state.tsx
    skeleton-table.tsx
  /circuit-nation                 ← CN-specific components only
  /tier-nation                    ← TN-specific components only

/lib
  /circuit-nation
    api.ts                        ← All CN API calls
    queries.ts                    ← TanStack Query keys + hooks
    types.ts
    validators.ts                 ← Zod schemas
  /tier-nation
    api.ts
    queries.ts
    types.ts
    validators.ts
  utils.ts
  cn.ts                           ← clsx + tailwind-merge helper

/hooks
  use-debounce.ts
  use-pagination.ts

/providers
  query-provider.tsx
  theme-provider.tsx
```

---

## Layout & Navigation

### Root Dashboard Layout

```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

### Sidebar Structure use Shadcn Sidebar

```tsx
// lib/nav-config.ts — centralized nav, not hardcoded in components
import { CalendarDays, Users, Layers, Trophy, List, Tag } from "lucide-react";

export const NAV_ITEMS = [
  {
    label: "Circuit Nation",
    items: [
      { label: "Events", href: "/circuit-nation/events", icon: CalendarDays },
      { label: "Drivers", href: "/circuit-nation/drivers", icon: Users },
      { label: "Sports", href: "/circuit-nation/sports", icon: Trophy },
      { label: "Teams", href: "/circuit-nation/teams", icon: Layers },
    ],
  },
  {
    label: "Tier Nation",
    items: [
      { label: "Entities", href: "/tier-nation/entities", icon: Tag },
      { label: "Lists", href: "/tier-nation/lists", icon: List },
    ],
  },
];
```

### Page Header Component

Every list page must start with a consistent header.

```tsx
// components/shared/page-header.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

---

## TanStack Query — Data Fetching

### Provider Setup

```tsx
// providers/query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Query Key Factory Pattern

Never use raw strings as query keys. Use a factory to keep keys typed and consistent.

```tsx
// lib/circuit-nation/queries.ts
export const cnKeys = {
  all: ["circuit-nation"] as const,
  events: {
    all: () => [...cnKeys.all, "events"] as const,
    list: (filters?: EventFilters) => [...cnKeys.events.all(), "list", filters] as const,
    detail: (id: string) => [...cnKeys.events.all(), "detail", id] as const,
  },
  drivers: {
    all: () => [...cnKeys.all, "drivers"] as const,
    list: (filters?: DriverFilters) => [...cnKeys.drivers.all(), "list", filters] as const,
    detail: (id: string) => [...cnKeys.drivers.all(), "detail", id] as const,
    championship: (year: number) => [...cnKeys.drivers.all(), "championship", year] as const,
  },
  teams: {
    all: () => [...cnKeys.all, "teams"] as const,
    list: () => [...cnKeys.teams.all(), "list"] as const,
    championship: (year: number) => [...cnKeys.teams.all(), "championship", year] as const,
  },
  sports: {
    all: () => [...cnKeys.all, "sports"] as const,
    list: () => [...cnKeys.sports.all(), "list"] as const,
  },
};
```

### Custom Query Hooks — One Per Resource

```tsx
// lib/circuit-nation/queries.ts (continued)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cnApi } from "./api";

// ── Queries ────────────────────────────────────────────────────────────────

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: cnKeys.events.list(filters),
    queryFn: () => cnApi.events.list(filters),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: cnKeys.events.detail(id),
    queryFn: () => cnApi.events.get(id),
    enabled: Boolean(id),
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cnApi.events.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cnKeys.events.all() });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) =>
      cnApi.events.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: cnKeys.events.all() });
      qc.invalidateQueries({ queryKey: cnKeys.events.detail(id) });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cnApi.events.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cnKeys.events.all() });
    },
  });
}
```

---

## TanStack Table — Data Tables

### Reusable DataTable Component

Build one generic table component and reuse it everywhere.

```tsx
// components/shared/data-table.tsx
"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-4">
      {searchKey && (
        <Input
          placeholder={searchPlaceholder}
          value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination table={table} />
    </div>
  );
}

function TablePagination({ table }: { table: ReturnType<typeof useReactTable<any>> }) {
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-muted-foreground text-sm">
        {table.getFilteredRowModel().rows.length} result(s)
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-sm">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### Column Definitions — Best Practices

```tsx
// components/circuit-nation/events/events-columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { format } from "date-fns";
import type { Event } from "@/lib/circuit-nation/types";

// Keep column definitions outside the component — they don't change
export const eventsColumns = (
  onEdit: (event: Event) => void,
  onDelete: (id: string) => void
): ColumnDef<Event>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Event Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "sport",
    header: "Sport",
    cell: ({ row }) => row.original.sport?.name ?? "—",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => format(new Date(getValue() as string), "dd MMM yyyy"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(row.original._id)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
```

### Wiring DataTable with TanStack Query

```tsx
// app/(dashboard)/circuit-nation/events/page.tsx
"use client";

import { useEvents } from "@/lib/circuit-nation/queries";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { eventsColumns } from "@/components/circuit-nation/events/events-columns";
import { SkeletonTable } from "@/components/shared/skeleton-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateEventDialog } from "@/components/circuit-nation/events/create-event-dialog";

export default function EventsPage() {
  const { data: events, isLoading } = useEvents();
  const [createOpen, setCreateOpen] = useState(false);

  const columns = eventsColumns(
    (event) => console.log("edit", event), // replace with edit handler
    (id) => console.log("delete", id)
  );

  return (
    <>
      <PageHeader
        title="Events"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={8} columns={5} />
      ) : (
        <DataTable
          columns={columns}
          data={events ?? []}
          searchKey="name"
          searchPlaceholder="Search events..."
        />
      )}

      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
```

---

## shadcn/ui Components

### Never Modify Files in `/components/ui`

These are auto-generated by shadcn CLI. Treat them as read-only. Customization happens through:

- **Composition** — wrap them in your own component.
- **CSS variables** — override design tokens in `globals.css`.
- **Variants** — use `class-variance-authority` (CVA) in your wrapper.

### Shared Status Badge

```tsx
// components/shared/status-badge.tsx
import { cn } from "@/lib/cn";
import { STATUS_VARIANTS } from "@/lib/badge-variants";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant =
    STATUS_VARIANTS[status as keyof typeof STATUS_VARIANTS] ?? STATUS_VARIANTS.inactive;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variant
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
```

### Confirm Delete Dialog

```tsx
// components/shared/confirm-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Skeleton Table (Loading State)

```tsx
// components/shared/skeleton-table.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-64" />
      <div className="rounded-md border">
        <div className="border-b px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="mr-6 mb-0 inline-block h-4 w-24" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-6 border-b px-4 py-3 last:border-0">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-28" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Tailwind v4 Conventions

Tailwind v4 uses CSS-first configuration (`@theme` in CSS) instead of `tailwind.config.js`.

### Design Token Setup

```css
/* app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  --color-brand-primary: oklch(0.6 0.2 250);
  --color-brand-secondary: oklch(0.5 0.15 30);

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  --font-sans: "Inter", ui-sans-serif, system-ui;
}

/* shadcn CSS variables for dark mode */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... rest of shadcn tokens */
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}
```

### Class Naming Conventions

- Use Tailwind utility classes directly — no custom CSS unless unavoidable.
- Use the `cn()` helper for conditional classes:

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}
```

- Group Tailwind classes by concern: layout → spacing → typography → color → state

```tsx
// ✅ Ordered and readable
<div className="flex items-center gap-4 px-6 py-3 text-sm font-medium text-foreground hover:bg-accent">
```

- Never use inline `style={{}}` unless working with dynamic values that can't be expressed as utilities (e.g., dynamic widths from JS).

---

## Forms with React Hook Form + Zod

### Standard Form Pattern

```tsx
// components/circuit-nation/events/create-event-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4"; // zod v4 import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateEvent } from "@/lib/circuit-nation/queries";
import { toast } from "sonner";
import { eventSchema } from "@/lib/circuit-nation/validators";

type EventFormValues = z.infer<typeof eventSchema>;

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
  const createEvent = useCreateEvent();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { name: "", status: "pending" },
  });

  async function onSubmit(values: EventFormValues) {
    try {
      await createEvent.mutateAsync(values);
      toast.success("Event created successfully");
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create event. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEvent.isPending}>
                {createEvent.isPending ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Notifications & Feedback

Use **Sonner** (`sonner`) for all toast notifications.

```tsx
// app/layout.tsx
import { Toaster } from "sonner";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
```

```tsx
// Usage conventions
toast.success("Driver added to championship.");
toast.error("Something went wrong. Please try again.");
toast.loading("Saving changes...", { id: "save" });
toast.dismiss("save");

// Never expose technical details in toast messages
// ❌ toast.error(`PUT /api/drivers failed: 500 Internal Server Error`);
// ✅ toast.error("Failed to update driver. Please try again.");
```

---

## Error & Loading States

### Query Error Handling

```tsx
const { data, isLoading, isError } = useEvents();

if (isLoading) return <SkeletonTable rows={8} columns={5} />;

if (isError)
  return (
    <EmptyState
      icon={AlertCircle}
      title="Something went wrong"
      description="We couldn't load the events. Please refresh the page."
    />
  );
```

### Empty State Component

```tsx
// components/shared/empty-state.tsx
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="text-muted-foreground/50 mb-4 h-10 w-10" />
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```
