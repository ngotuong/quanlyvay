/**
 * Adds the page envelope introduced by C20 to the legacy authoritative loan
 * summary response. This is intentionally small: filtering, sorting and money
 * calculations remain inside the database RPC.
 *
 * @param {{ items?: unknown[], counts?: Record<string, number> }} payload
 * @param {number} page
 * @param {number} size
 */
export function paginateLegacyLoanSummaries(payload, page, size) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const offset = (page - 1) * size;
  return {
    items: items.slice(offset, offset + size),
    counts: payload?.counts ?? {},
    totalCount: items.length,
  };
}
