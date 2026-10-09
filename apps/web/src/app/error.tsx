"use client";
import { EmptyState } from "@/components/ui/empty-state";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const subscribeHydration = () => () => {};

export default function ErrorPage() {
  const interactive = useSyncExternalStore(subscribeHydration, () => true, () => false);
  return <EmptyState role="alert"><h1>Chưa thể tải dữ liệu</h1>
    <p>Kiểm tra kết nối rồi thử lại. Nếu phiên đăng nhập đã hết hạn, hãy đăng nhập lại.</p>
    <div className="empty-actions"><button className="primary-button" disabled={!interactive} onClick={() => window.location.reload()}>Thử lại</button><Link className="secondary-link" href="/dashboard">Về tổng quan</Link><Link className="secondary-link" href="/login">Đăng nhập</Link></div>
  </EmptyState>;
}
