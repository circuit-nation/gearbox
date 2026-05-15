import type {
  Circuit,
  CreateCircuit,
  CreateDriver,
  CreateDriverLeaderboard,
  CreateEvent,
  UpdateEvent,
  CreateSport,
  CreateTeam,
  CreateTeamLeaderboard,
  Driver,
  DriverLeaderboardEntry,
  Event,
  Sport,
  Team,
  TeamLeaderboardEntry,
} from "@/lib/circuit-nation/types";

type ListResponse<T> = {
  total: number;
  documents: T[];
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type UploadUrlResponse = {
  uploadUrl?: string;
  key?: string;
  error?: string;
};

type SignedImageUrlResponse = {
  url?: string;
  error?: string;
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

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as { data?: T; error?: string } & T) : undefined;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }

  return (payload?.data ?? payload) as T;
}

async function uploadToSignedUrl(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "image/jpeg",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image.");
  }
}

export const cnApi = {
  events: {
    list: (filters: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      filterTitle?: string;
      filterType?: string;
      filterSport?: string;
    }) => request<ListResponse<Event>>(withQuery("/api/events", filters)),
    get: (id: string) => request<Event | null>(withQuery("/api/events", { id })),
    create: (data: CreateEvent) =>
      request<Event | null>("/api/events", { method: "POST", body: data }),
    update: (id: string, data: UpdateEvent) =>
      request<Event | null>("/api/events", { method: "PUT", body: { id, ...data } }),
    delete: (id: string) =>
      request<{ success: boolean; id: string }>(withQuery("/api/events", { id }), {
        method: "DELETE",
      }),
  },
  drivers: {
    list: (filters: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      filterName?: string;
      filterSport?: string;
      filterTeam?: string;
    }) => request<ListResponse<Driver>>(withQuery("/api/drivers", filters)),
    get: (id: string) => request<Driver | null>(withQuery("/api/drivers", { id })),
    create: (data: CreateDriver) =>
      request<Driver | null>("/api/drivers", { method: "POST", body: data }),
    update: (id: string, data: Partial<Driver>) =>
      request<Driver | null>("/api/drivers", { method: "PUT", body: { id, ...data } }),
    delete: (id: string) =>
      request<{ success: boolean; id: string }>(withQuery("/api/drivers", { id }), {
        method: "DELETE",
      }),
  },
  sports: {
    list: (filters: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      filterName?: string;
      filterType?: string;
    }) => request<ListResponse<Sport>>(withQuery("/api/sports", filters)),
    get: (id: string) => request<Sport | null>(withQuery("/api/sports", { id })),
    create: (data: CreateSport) =>
      request<Sport | null>("/api/sports", { method: "POST", body: data }),
    update: (id: string, data: Partial<Sport>) =>
      request<Sport | null>("/api/sports", { method: "PUT", body: { id, ...data } }),
    delete: (id: string) =>
      request<{ success: boolean; id: string }>(withQuery("/api/sports", { id }), {
        method: "DELETE",
      }),
  },
  teams: {
    list: (filters: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      filterName?: string;
      filterSport?: string;
    }) => request<ListResponse<Team>>(withQuery("/api/teams", filters)),
    get: (id: string) => request<Team | null>(withQuery("/api/teams", { id })),
    create: (data: CreateTeam) =>
      request<Team | null>("/api/teams", { method: "POST", body: data }),
    update: (id: string, data: Partial<Team>) =>
      request<Team | null>("/api/teams", { method: "PUT", body: { id, ...data } }),
    delete: (id: string) =>
      request<{ success: boolean; id: string }>(withQuery("/api/teams", { id }), {
        method: "DELETE",
      }),
  },
  circuits: {
    list: (filters: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      filterName?: string;
      filterSport?: string;
      filterCountry?: string;
    }) => request<ListResponse<Circuit>>(withQuery("/api/circuits", filters)),
    get: (id: string) => request<Circuit | null>(withQuery("/api/circuits", { id })),
    create: (data: CreateCircuit) =>
      request<Circuit | null>("/api/circuits", { method: "POST", body: data }),
    update: (id: string, data: Partial<Circuit>) =>
      request<Circuit | null>("/api/circuits", { method: "PUT", body: { id, ...data } }),
    delete: (id: string) =>
      request<{ success: boolean; id: string }>(withQuery("/api/circuits", { id }), {
        method: "DELETE",
      }),
  },
  leaderboard: {
    drivers: (filters: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      filterYear?: number;
      filterName?: string;
      filterSport?: string;
      filterTeam?: string;
    }) =>
      request<ListResponse<DriverLeaderboardEntry>>(withQuery("/api/leaderboard/drivers", filters)),
    getDriver: (id: string) =>
      request<DriverLeaderboardEntry | null>(withQuery("/api/leaderboard/drivers", { id })),
    createDriver: (data: CreateDriverLeaderboard) =>
      request<DriverLeaderboardEntry | null>("/api/leaderboard/drivers", {
        method: "POST",
        body: data,
      }),
    updateDriver: (id: string, data: Partial<CreateDriverLeaderboard>) =>
      request<DriverLeaderboardEntry | null>("/api/leaderboard/drivers", {
        method: "PUT",
        body: { id, ...data },
      }),
    deleteDriver: (id: string) =>
      request<{ success: boolean; id: string }>(withQuery("/api/leaderboard/drivers", { id }), {
        method: "DELETE",
      }),
    teams: (filters: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      filterYear?: number;
      filterSport?: string;
      filterTeam?: string;
    }) => request<ListResponse<TeamLeaderboardEntry>>(withQuery("/api/leaderboard/teams", filters)),
    getTeam: (id: string) =>
      request<TeamLeaderboardEntry | null>(withQuery("/api/leaderboard/teams", { id })),
    createTeam: (data: CreateTeamLeaderboard) =>
      request<TeamLeaderboardEntry | null>("/api/leaderboard/teams", {
        method: "POST",
        body: data,
      }),
    updateTeam: (id: string, data: Partial<CreateTeamLeaderboard>) =>
      request<TeamLeaderboardEntry | null>("/api/leaderboard/teams", {
        method: "PUT",
        body: { id, ...data },
      }),
    deleteTeam: (id: string) =>
      request<{ success: boolean; id: string }>(withQuery("/api/leaderboard/teams", { id }), {
        method: "DELETE",
      }),
    updatePoints: (data: { id: string; mode: "add" | "set"; value: number }) =>
      request<DriverLeaderboardEntry | null>("/api/leaderboard/points", {
        method: "PUT",
        body: data,
      }),
  },
  images: {
    getSignedUrl: async (key: string) => {
      const payload = await request<SignedImageUrlResponse>(
        withQuery("/api/get-image-url", { key })
      );
      if (!payload.url) {
        throw new Error(payload.error ?? "Failed to resolve image URL.");
      }
      return payload.url;
    },
    getUploadUrl: async (params: {
      contentType: string;
      extension: string;
      folder: string;
      name: string;
    }) => {
      const payload = await request<UploadUrlResponse>(withQuery("/api/upload-url", params));
      if (!payload.uploadUrl || !payload.key) {
        throw new Error(payload.error ?? "Failed to get upload URL.");
      }
      return payload as { uploadUrl: string; key: string };
    },
    uploadToSignedUrl,
  },
};

export type { ListResponse };
