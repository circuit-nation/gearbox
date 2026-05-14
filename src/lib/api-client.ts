export type ListResponse<T> = {
  total: number;
  documents: T[];
};

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function readFetchErrorMessage(response: Response) {
  let message = "Request failed";
  try {
    const errorBody = await response.json();
    message = errorBody?.error || message;
  } catch {
    // Ignore JSON parse errors and use default message.
  }
  return message;
}

export async function fetchJson<T>(url: string, options?: FetchOptions): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await readFetchErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

/**
 * Admin-style mutation: JSON body only when `body` is set; no Content-Type on DELETE-only calls.
 * Returns `undefined` for 204 or empty success bodies.
 */
export async function fetchMutation<T = { message: string }>(
  url: string,
  init: { method: "DELETE" | "PATCH" | "POST" | "PUT"; body?: unknown; headers?: HeadersInit },
): Promise<T | undefined> {
  const hasBody = init.body !== undefined;
  const response = await fetch(url, {
    method: init.method,
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    body: hasBody ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await readFetchErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined;
  }

  return JSON.parse(text) as T;
}

export function buildQuery(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}
