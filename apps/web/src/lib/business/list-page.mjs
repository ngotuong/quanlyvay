/** Clamp only after the authoritative, filtered count is known. */
export function clampPage(page, total, size = 25) {
  return Math.min(Math.max(1, page), Math.max(1, Math.ceil(total / size)));
}

export function pageHref(href, page) {
  const [pathname, query] = href.split("?");
  const params = new URLSearchParams(query);
  if (page === 1) params.delete("page"); else params.set("page", String(page));
  return pathname + (params.size ? `?${params}` : "");
}
