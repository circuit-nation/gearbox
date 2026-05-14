function normalizeBaseUrl(raw: string) {
  return raw.replace(/\/+$/, "");
}

/** Public catalog reads only need the API base URL. */
export function getTierNationApiBaseUrl() {
  const baseUrl = process.env.TIER_NATION_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error("TIER_NATION_API_BASE_URL is not set.");
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("TIER_NATION_API_BASE_URL is not a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("TIER_NATION_API_BASE_URL must be http or https.");
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
  const username = process.env.TIER_NATION_ADMIN_USERNAME;
  const password = process.env.TIER_NATION_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Tier Nation admin is not configured. Set TIER_NATION_ADMIN_USERNAME and TIER_NATION_ADMIN_PASSWORD."
    );
  }

  return {
    baseUrl,
    authorization: basicAuthHeader(username, password),
  };
}

/**
 * Public catalog: `GET /api/v1/lists` when `TIER_NATION_API_BASE_URL` includes `/api/v1`.
 * `pathWithQuery` must start with `/lists` (optional query only on `/lists`).
 */
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

/** Proxies to upstream `/admin/*` (i.e. `GET {base}/admin/...` with Basic auth). Base URL should be `/api/v1` root. */
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
