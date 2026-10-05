import Link from "next/link";
import { pageHref } from "@/lib/business/list-page.mjs";

export function parsePage(raw: string | string[] | undefined) {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isSafeInteger(value) && value > 0 && value <= 1_000_000 ? value : 1;
}

export function Pagination({ page, total, pageSize = 25, href, label = "Phân trang", className = "", hideSinglePage = false }: { page: number; total: number; pageSize?: number; href: string; label?: string; className?: string; hideSinglePage?: boolean }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const link = (next: number) => pageHref(href, next);
  return total && !(hideSinglePage && pages === 1) ? <nav className={`audit-pagination ${className}`} aria-label={label}><p>Trang {page} / {pages} · {total} bản ghi</p><div>
    {page > 1 ? <Link className="secondary-link" aria-label={label === "Phân trang" ? undefined : `Trang trước, ${label.toLocaleLowerCase("vi")}`} href={link(page - 1)}>Trang trước</Link> : null}
    {page < pages ? <Link className="secondary-link" aria-label={label === "Phân trang" ? undefined : `Trang sau, ${label.toLocaleLowerCase("vi")}`} href={link(page + 1)}>Trang sau</Link> : null}
  </div></nav> : null;
}
