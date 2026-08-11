"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

export function MobileCreateLoanLink({ canWrite }: { canWrite: boolean }) {
  const pathname = usePathname();
  if (!canWrite || pathname !== "/loans") return null;
  return <Link className="header-create-link" href="/loans/new"><Plus size={18} /> Tạo khoản vay</Link>;
}
