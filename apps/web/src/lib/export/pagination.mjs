const DEFAULT_PAGE_SIZE = 1000;

/**
 * @template {Record<string, unknown>} T
 * @param {(from: number, to: number) => PromiseLike<{data: T[] | null, error: unknown}>} queryPage
 * @param {number} [pageSize]
 * @returns {Promise<{data: T[], error: unknown}>}
 */
export async function fetchAllRows(queryPage, pageSize = DEFAULT_PAGE_SIZE) {
  /** @type {T[]} */
  const data = [];

  for (let from = 0; ; from += pageSize) {
    const result = await queryPage(from, from + pageSize - 1);
    if (result.error) return { data: [], error: result.error };
    const page = result.data ?? [];
    data.push(...page);
    if (page.length < pageSize) return { data, error: null };
  }
}
