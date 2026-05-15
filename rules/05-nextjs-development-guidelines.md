# Next.js Best Practices Guidelines

A comprehensive ruleset for writing performant, maintainable, and scalable Next.js applications.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Component Architecture](#component-architecture)
3. [Data Fetching](#data-fetching)
4. [Hooks — Rules & Best Practices](#hooks--rules--best-practices)
5. [Avoid useEffect — Alternatives](#avoid-useeffect--alternatives)
6. [Performance & Speed](#performance--speed)
7. [Image & Font Optimization](#image--font-optimization)
8. [Routing & Navigation](#routing--navigation)
9. [State Management](#state-management)
10. [TypeScript](#typescript)
11. [Security](#security)

---

## Project Structure

- **Use the App Router** (`/app`) over the legacy Pages Router for all new projects.
- Co-locate components, hooks, and utilities with the feature they belong to.
- Keep the `/app` directory clean — only route segments, layouts, and pages live there.

```
/app
  /dashboard
    page.tsx          ← Route page
    layout.tsx        ← Segment layout
    _components/      ← Local components (prefixed _ to exclude from routing)
    _hooks/           ← Feature-specific hooks
/components           ← Shared/global components
/lib                  ← Utilities, helpers, API clients
/hooks                ← Global reusable hooks
/types                ← Shared TypeScript types
```

- Never put business logic inside `page.tsx` — delegate to components and hooks.
- Keep components under **200 lines**. Split if they grow larger.

---

## Component Architecture

### ✅ Default to Server Components

Every component in the App Router is a **Server Component** by default. Keep it that way unless you have a specific reason to go client-side.

```tsx
// ✅ Server Component — no directive needed
export default async function ProductList() {
  const products = await fetchProducts(); // runs on the server
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

### Use `"use client"` Sparingly

Only mark a component as a Client Component when it needs:

- Browser APIs (`window`, `document`, `localStorage`)
- Event listeners (`onClick`, `onChange`)
- React state (`useState`, `useReducer`)
- Third-party client-only libraries

```tsx
// ✅ Only use "use client" when truly necessary
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

### Push `"use client"` to the Leaves

Keep the client boundary as deep in the component tree as possible. Wrap only the interactive parts, not entire pages.

```tsx
// ❌ Bad — entire page becomes a client bundle
"use client";
export default function Page() { ... }

// ✅ Good — only the interactive island is client-side
export default function Page() {
  return (
    <main>
      <StaticContent />       {/* Server Component */}
      <InteractiveWidget />   {/* "use client" inside this file */}
    </main>
  );
}
```

---

## Data Fetching

### Fetch on the Server by Default

```tsx
// ✅ Async Server Component — fetch directly, no useEffect, no useState
export default async function UserProfile({ id }: { id: string }) {
  const user = await getUser(id);
  return <div>{user.name}</div>;
}
```

### Use `fetch` with Next.js Caching

Next.js extends the native `fetch` with caching options. Always be explicit.

```tsx
// Cached indefinitely (default) — use for static data
const data = await fetch("/api/config", { cache: "force-cache" });

// Always fresh — use for real-time data
const data = await fetch("/api/stock", { cache: "no-store" });

// Revalidate every N seconds — use for semi-static data
const data = await fetch("/api/news", { next: { revalidate: 60 } });
```

### Parallel Data Fetching

Never chain awaits when requests are independent. Use `Promise.all`.

```tsx
// ❌ Bad — sequential, slow
const user = await getUser(id);
const orders = await getOrders(id);

// ✅ Good — parallel, fast
const [user, orders] = await Promise.all([getUser(id), getOrders(id)]);
```

### Use React `cache()` for Deduplication

```tsx
import { cache } from "react";

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});
// Calling getUser(id) multiple times in one render only hits the DB once
```

### Use Server Actions for Mutations

Replace API route handlers with Server Actions for form submissions and mutations.

```tsx
// app/actions.ts
"use server";
export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  await db.post.create({ data: { title } });
  revalidatePath("/posts");
}

// app/posts/new/page.tsx
import { createPost } from "../actions";
export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## Hooks — Rules & Best Practices

### The Rules of Hooks (Non-Negotiable)

- **Only call hooks at the top level** — never inside loops, conditions, or nested functions.
- **Only call hooks from React functions** — function components or custom hooks.
- **Always prefix custom hooks with `use`**.

```tsx
// ❌ Bad
function Component({ isAdmin }) {
  if (isAdmin) {
    const [data, setData] = useState(null); // Conditional hook — NEVER do this
  }
}

// ✅ Good
function Component({ isAdmin }) {
  const [data, setData] = useState(null);
  if (!isAdmin) return null;
}
```

### Preferred Hooks & When to Use Each

| Hook               | Use When                                               |
| ------------------ | ------------------------------------------------------ |
| `useState`         | Simple, local UI state (toggles, inputs, counters)     |
| `useReducer`       | Complex state with multiple sub-values or transitions  |
| `useRef`           | Mutable values that don't trigger re-renders; DOM refs |
| `useMemo`          | Expensive computations that depend on specific values  |
| `useCallback`      | Stable function references passed to memoized children |
| `useContext`       | Consuming values from a React Context                  |
| `useTransition`    | Marking non-urgent state updates to keep UI responsive |
| `useDeferredValue` | Deferring a derived value to avoid blocking renders    |
| `useOptimistic`    | Optimistic UI updates during async Server Actions      |
| `useFormStatus`    | Reading the pending state of a parent `<form>`         |

### Custom Hooks — Extract Logic, Not JSX

```tsx
// ✅ Good custom hook
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}
```

Hooks should be a single responsibility. If a hook does too many things, split it.

---

## Avoid useEffect — Alternatives

`useEffect` is one of the most misused hooks. Before reaching for it, try these alternatives.

### ❌ Fetching Data in useEffect

```tsx
// ❌ Anti-pattern
useEffect(() => {
  fetch("/api/user")
    .then((r) => r.json())
    .then(setUser);
}, []);
```

```tsx
// ✅ Fetch on the server in a Server Component
export default async function Page() {
  const user = await getUser();
  return <Profile user={user} />;
}

// ✅ On the client, use a dedicated library TanStack Query
const { data: user } = useQuery("/api/user", fetcher);
```

### ❌ Deriving State with useEffect

```tsx
// ❌ Anti-pattern — using useEffect to sync derived state
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

```tsx
// ✅ Compute during render — no hook needed
const fullName = `${firstName} ${lastName}`;
```

### ❌ Resetting State on Prop Change with useEffect

```tsx
// ❌ Anti-pattern
useEffect(() => {
  setComment("");
}, [postId]);
```

```tsx
// ✅ Use the `key` prop — React resets component state automatically
<CommentBox key={postId} postId={postId} />
```

### ❌ Triggering Side Effects After Events

```tsx
// ❌ Anti-pattern — useEffect reacting to state change caused by a handler
const [submitted, setSubmitted] = useState(false);
useEffect(() => {
  if (submitted) sendAnalytics();
}, [submitted]);
```

```tsx
// ✅ Call the side effect directly in the event handler
function handleSubmit() {
  setSubmitted(true);
  sendAnalytics(); // ← right here
}
```

### When useEffect IS Acceptable

- Subscribing to external non-React systems (WebSockets, native events, third-party widgets).
- Syncing with browser APIs (`localStorage`, `IntersectionObserver`, etc.).
- Running code only once after mount for third-party library initialization.

Always return a cleanup function to prevent memory leaks:

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetchData({ signal: controller.signal });
  return () => controller.abort();
}, [id]);
```

---

## Performance & Speed

### Use `React.memo`, `useMemo`, and `useCallback` Wisely

Memoize only when you have a measured performance problem. Premature memoization adds overhead.

```tsx
// ✅ Memoize expensive computations
const sortedList = useMemo(() => expensiveSort(items), [items]);

// ✅ Stabilize callbacks passed to memoized children
const handleClick = useCallback(() => doSomething(id), [id]);

// ✅ Prevent unnecessary re-renders of pure components
const Row = React.memo(function Row({ data }) {
  return <tr>{data.name}</tr>;
});
```

### Use `useTransition` for Non-Urgent Updates

```tsx
const [isPending, startTransition] = useTransition();

function handleSearch(value: string) {
  startTransition(() => {
    setSearchQuery(value); // Won't block input from feeling snappy
  });
}
```

### Code Splitting with `dynamic()`

Lazy-load heavy components that aren't needed on initial render.

```tsx
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("@/components/HeavyChart"), {
  loading: () => <Skeleton />,
  ssr: false, // only if the component uses browser APIs
});
```

### Streaming with Suspense

Use `<Suspense>` to stream slow parts of the page without blocking the fast parts.

```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <main>
      <FastHeader />
      <Suspense fallback={<Skeleton />}>
        <SlowDataComponent /> {/* Streams in when ready */}
      </Suspense>
    </main>
  );
}
```

### Use `loading.tsx` for Route-Level Loading UI

```
/app/dashboard/
  page.tsx
  loading.tsx   ← Shows instantly while page.tsx is loading
```

### Minimize Client Bundle Size

- Audit your bundle with `@next/bundle-analyzer`.
- Prefer server-side imports over client-side ones.
- Import only what you need from large libraries:

```tsx
// ❌ Bad
import _ from "lodash";

// ✅ Good
import debounce from "lodash/debounce";
```

---

## Image & Font Optimization

### Always Use `next/image`

```tsx
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Use for above-the-fold images (LCP element)
  placeholder="blur"
  blurDataURL="..." // Low-res preview while loading
/>;
```

- Never use a raw `<img>` tag for content images.
- Set `priority` only on above-the-fold images to avoid delaying other resources.
- Use `sizes` prop for responsive images to serve correctly sized assets.

### Always Use `next/font`

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Loaded at build time — zero layout shift, zero extra network request
```

- Never load fonts via a `<link>` tag in `<head>` — it blocks rendering.
- Use `display: "swap"` to prevent invisible text during font loading.

---

## Routing & Navigation

### Use `<Link>` for All Internal Navigation

```tsx
import Link from "next/link";

// ✅ Prefetches in viewport automatically
<Link href="/about">About</Link>

// Disable prefetch for rarely visited pages
<Link href="/admin" prefetch={false}>Admin</Link>
```

### Use `useRouter` Only for Programmatic Navigation

```tsx
"use client";
import { useRouter } from "next/navigation"; // ← App Router import

const router = useRouter();
router.push("/dashboard");
router.replace("/login");
router.back();
```

### Parallel and Intercepting Routes for Complex UIs

Use **Parallel Routes** (`@slot`) for dashboards with multiple independent views, and **Intercepting Routes** for modal patterns without losing URL state.

### Use proxy (older middleware) for Auth & Redirects

```ts
// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token");
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

---

## State Management

### Hierarchy of State Solutions

Choose the simplest solution that solves your problem:

```
Local useState → useReducer → Context → Zustand/Jotai → Server State (SWR/TanStack Query)
```

1. **`useState`** — component-local, ephemeral UI state.
2. **`useReducer`** — complex local state with many transitions.
3. **React Context** — global but infrequently changing state (theme, locale, auth user).
4. **Zustand / Jotai** — global client state that changes often.
5. **TanStack Query** — server state: fetching, caching, revalidating.

### Never Store Server Data in Client State

```tsx
// ❌ Bad — fetching in useEffect and storing in useState
const [posts, setPosts] = useState([]);
useEffect(() => { fetch("/api/posts").then(...).then(setPosts); }, []);

// ✅ Good — server state belongs in SWR/TanStack Query
const { data: posts } = useSWR("/api/posts", fetcher);

// ✅ Even better — fetch on the server in a Server Component
const posts = await getPosts();
```

---

## TypeScript

- Enable `strict: true` in `tsconfig.json` — non-negotiable.
- Type your `page.tsx` props using the built-in `PageProps` pattern:

```tsx
type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function Page({ params, searchParams }: Props) { ... }
```

- Use `zod` to validate and type external data (API responses, form inputs, env vars).
- Never use `any`. Use `unknown` and narrow with type guards.

```tsx
// ❌ Bad
function process(data: any) { ... }

// ✅ Good
function process(data: unknown) {
  if (typeof data === "string") { ... }
}
```

---

## Security

- **Validate all inputs** on the server — never trust client-sent data.
- Use **Server Actions** with `zod` for form validation:

```ts
"use server";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function subscribe(formData: FormData) {
  const result = schema.safeParse({ email: formData.get("email") });
  if (!result.success) throw new Error("Invalid input");
  // proceed safely
}
```

- Store secrets in `.env.local` — never expose them to the client.
  - `NEXT_PUBLIC_` prefix = exposed to browser. Use only for truly public values.
  - Everything else stays server-side only.
- Set proper **Content Security Policy** headers in `next.config.ts`.
- Use `next/headers` to read cookies securely on the server:

```ts
import { cookies } from "next/headers";
const token = (await cookies()).get("token")?.value;
```

---

## Quick Reference Checklist

```
✅ Default to Server Components
✅ Fetch data on the server — no useEffect for data fetching
✅ Use parallel fetching with Promise.all
✅ Use next/image for all images, with correct width/height and priority
✅ Use next/font — never a <link> tag for fonts
✅ Push "use client" to the leaves
✅ Use Suspense + loading.tsx for streaming
✅ Lazy-load heavy components with dynamic()
✅ Use Server Actions for mutations
✅ Choose the simplest state solution that works
✅ Avoid useEffect — use better alternatives
✅ Enable TypeScript strict mode
✅ Validate all server inputs with zod
✅ Never expose secrets with NEXT_PUBLIC_ unless truly public
```
