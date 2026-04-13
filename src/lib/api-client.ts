export type ListResponse<T> = {
  total: number;
  documents: T[];
};

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function fetchJson<T>(url: string, options?: FetchOptions): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const errorBody = await response.json();
      message = errorBody?.error || message;
    } catch {
      // Ignore JSON parse errors and use default message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
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
