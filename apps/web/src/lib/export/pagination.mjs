const DEFAULT_PAGE_SIZE = 1000;
const DEFAULT_MAX_ATTEMPTS = 2;

/**
 * @template {Record<string, unknown>} T
 * @param {(from: number, to: number) => PromiseLike<{data: T[] | null, error: unknown}>} queryPage
 * @param {number} [pageSize]
 * @param {number} [maxAttempts]
 * @returns {Promise<{data: T[], error: unknown}>}
 */
export async function fetchAllRows(queryPage, pageSize = DEFAULT_PAGE_SIZE, maxAttempts = DEFAULT_MAX_ATTEMPTS) {
  /** @type {T[]} */
  const data = [];

  for (let from = 0; ; from += pageSize) {
    let result;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      result = await queryPage(from, from + pageSize - 1);
      if (!result.error || attempt === maxAttempts) break;
    }
    if (!result) return { data: [], error: new Error("Export query did not run") };
    if (result.error) return { data: [], error: result.error };
    const page = result.data ?? [];
    data.push(...page);
    if (page.length < pageSize) return { data, error: null };
  }
}
