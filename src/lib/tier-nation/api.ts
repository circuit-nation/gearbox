import { ENV } from "@/config/config";
import type {
  AdminEntitiesBody,
  EntityAdminResponse,
  MessageResponse,
  PublicListDetail,
  PublicListsResponse,
  ReorderListEntitiesRequest,
  TierListResponse,
  UpdateEntityRequest,
  UpdateTierListRequest,
  CreateTierListRequest,
} from "@/lib/tier-nation/types";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const withQuery = (path: string, params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
};

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const hasBody = options?.body !== undefined;
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers ?? {}),
    },
    body: hasBody ? JSON.stringify(options?.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as { data?: T; error?: string } & T) : undefined;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }

  return (payload?.data ?? payload) as T;
}

export const tnApi = {
  auth: {
    session: () => request<{ authenticated?: boolean }>("/api/auth/session"),
    login: (data: { username: string; password: string }) =>
      request<{ ok: boolean }>("/api/auth/login", { method: "POST", body: data }),
    logout: () => request<{ ok?: boolean }>("/api/auth/logout", { method: "POST" }),
  },
  catalog: {
    lists: (page = 1, limit = 100) =>
      request<PublicListsResponse>(withQuery("/api/tier-nation/catalog/lists", { page, limit })),
    listDetail: (listId: string) =>
      request<PublicListDetail>(`/api/tier-nation/catalog/lists/${encodeURIComponent(listId)}`),
  },
  admin: {
    lists: {
      create: (body: CreateTierListRequest) =>
        request<TierListResponse>("/api/tier-nation/admin/lists", { method: "POST", body }),
      update: (listId: string, body: UpdateTierListRequest) =>
        request<TierListResponse>(`/api/tier-nation/admin/lists/${listId}`, {
          method: "PATCH",
          body,
        }),
      delete: (listId: string) =>
        request<MessageResponse | undefined>(`/api/tier-nation/admin/lists/${listId}`, {
          method: "DELETE",
        }),
      archive: (listId: string) =>
        request<MessageResponse>(`/api/tier-nation/admin/lists/${listId}/archive`, {
          method: "PATCH",
        }),
      reorderEntities: (listId: string, body: ReorderListEntitiesRequest) =>
        request<MessageResponse>(`/api/tier-nation/admin/lists/${listId}/entities/order`, {
          method: "PATCH",
          body,
        }),
      addEntities: (listId: string, body: AdminEntitiesBody) =>
        request<MessageResponse>(`/api/tier-nation/admin/lists/${listId}/entities`, {
          method: "POST",
          body,
        }),
      removeEntity: (listId: string, entityId: string) =>
        request<MessageResponse | undefined>(
          `/api/tier-nation/admin/lists/${listId}/entities/${entityId}`,
          {
            method: "DELETE",
          }
        ),
    },
    entities: {
      createStandalone: (body: AdminEntitiesBody) =>
        request<MessageResponse>("/api/tier-nation/admin/entities", { method: "POST", body }),
      update: (entityId: string, body: UpdateEntityRequest) =>
        request<EntityAdminResponse>(`/api/tier-nation/admin/entities/${entityId}`, {
          method: "PATCH",
          body,
        }),
      delete: (entityId: string) =>
        request<MessageResponse | undefined>(`/api/tier-nation/admin/entities/${entityId}`, {
          method: "DELETE",
        }),
    },
  },
};

function normalizeBaseUrl(raw: string) {
  return raw.replace(/\/+$/, "");
}

export function getTierNationApiBaseUrl() {
  const baseUrl = ENV.TIER_NATION_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error("Tier Nation API is unavailable.");
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("Tier Nation API is unavailable.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Tier Nation API is unavailable.");
  }

  return normalizeBaseUrl(baseUrl);
}

function basicAuthHeader(username: string, password: string) {
  const credentials = `${username}:${password}`;
  const encoded = Buffer.from(credentials, "utf8").toString("base64");
  return `Basic ${encoded}`;
}

function getTierNationAdminConfig() {
  const baseUrl = getTierNationApiBaseUrl();
  const username = ENV.TIER_NATION_ADMIN_USERNAME;
  const password = ENV.TIER_NATION_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error("Tier Nation admin integration is unavailable.");
  }

  return {
    baseUrl,
    authorization: basicAuthHeader(username, password),
  };
}

export function assertSafePublicListsPath(pathWithQuery: string) {
  const pathOnly = pathWithQuery.split("?")[0] || "";
  if (pathOnly === "/lists") {
    return;
  }
  if (pathOnly.startsWith("/lists/")) {
    const rest = pathOnly.slice("/lists/".length);
    if (!rest || rest.includes("/") || rest.includes("..")) {
      throw new Error("Invalid list id in path.");
    }
    return;
  }
  throw new Error("Invalid public lists path.");
}

export async function tierNationPublicFetch(pathWithQuery: string, init?: RequestInit) {
  assertSafePublicListsPath(pathWithQuery);
  const baseUrl = getTierNationApiBaseUrl();
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  const url = `${baseUrl}${path}`;

  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers as HeadersInit),
    },
  });
}

export function assertSafeAdminPath(path: string) {
  if (!path.startsWith("/admin/")) {
    throw new Error("Invalid upstream path.");
  }
}

export async function tierNationAdminFetch(path: string, init: RequestInit) {
  assertSafeAdminPath(path);
  const { baseUrl, authorization } = getTierNationAdminConfig();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init.headers);
  headers.set("Authorization", authorization);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
