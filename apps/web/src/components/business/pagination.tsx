import Link from "next/link";

export function parsePage(raw: string | string[] | undefined) {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isSafeInteger(value) && value > 0 && value <= 1_000_000 ? value : 1;
}

export function Pagination({ page, total, pageSize = 25, href }: { page: number; total: number; pageSize?: number; href: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const link = (next: number) => {
    const [pathname, query] = href.split("?");
    const params = new URLSearchParams(query);
    if (next === 1) params.delete("page"); else params.set("page", String(next));
    return pathname + (params.size ? `?${params}` : "");
  };
  return total ? <nav className="audit-pagination" aria-label="Phân trang"><p>Trang {page} / {pages} · {total} bản ghi</p><div>
    {page > 1 ? <Link className="secondary-link" href={link(page - 1)}>Trang trước</Link> : null}
    {page < pages ? <Link className="secondary-link" href={link(page + 1)}>Trang sau</Link> : null}
  </div></nav> : null;
}
