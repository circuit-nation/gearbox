import { Types } from "mongoose";

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.max(parseInt(searchParams.get("limit") || "10", 10), 1);
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder: 1 | -1 = searchParams.get("sortOrder") === "asc" ? 1 : -1;

  return { page, limit, sortBy, sortOrder };
}

export function buildSort(sortBy: string, sortOrder: 1 | -1) {
  return { [sortBy]: sortOrder };
}

export function isValidObjectId(value: string | null | undefined): value is string {
  return Boolean(value && Types.ObjectId.isValid(value));
}

export function parseOptionalObjectId(value: string | null | undefined) {
  if (!value || value === "null" || value === "none") {
    return null;
  }
  return isValidObjectId(value) ? value : undefined;
}

export function parseYear(searchParams: URLSearchParams, fallback = new Date().getFullYear()) {
  const raw = searchParams.get("filterYear") ?? searchParams.get("year");
  if (!raw) {
    return fallback;
  }
  const year = parseInt(raw, 10);
  return Number.isFinite(year) ? year : fallback;
}
