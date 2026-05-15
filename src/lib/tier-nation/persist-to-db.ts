/** Optional local persistence hooks after successful Tier Nation upstream writes. */

export async function persistTierNationListSubmission(
  _request: Record<string, unknown>,
  _created: { id: string; name?: string }
) {
  // Intentionally no-op: Tier Nation is the source of truth for list data.
}

export async function persistTierNationEntitySubmissions(
  _listId: string | null,
  _context: "list" | "standalone",
  _request: Record<string, unknown>
) {
  // Intentionally no-op: Tier Nation is the source of truth for entity data.
}
