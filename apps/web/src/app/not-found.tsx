import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
export default function NotFound() {
  return <EmptyState><h1>Không tìm thấy nội dung</h1><p>Nội dung không tồn tại hoặc bạn không có quyền xem.</p><Link className="secondary-link" href="/loans">Quay lại danh sách</Link></EmptyState>;
}
