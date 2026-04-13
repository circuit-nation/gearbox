import { Types } from "mongoose";

type DocWithId = { _id: Types.ObjectId } & Record<string, unknown>;

type ListResponse<T> = {
  total: number;
  documents: T[];
};

export function toDocument<T extends Record<string, unknown>>(doc: DocWithId | null) {
  if (!doc) {
    return null;
  }

  const { _id, ...rest } = doc;
  return { _id: _id.toString(), ...rest } as T & { _id: string };
}

export function toDocuments<T extends Record<string, unknown>>(docs: DocWithId[]) {
  return docs.map((doc) => toDocument<T>(doc) as T & { _id: string });
}

export function buildListResponse<T extends Record<string, unknown>>(
  total: number,
  documents: T[]
): ListResponse<T> {
  return { total, documents };
}
