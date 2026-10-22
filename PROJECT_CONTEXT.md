---
project: QuanLyVayCaNhan
roadmap_version: 1.0.363
last_updated: 2026-10-22
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C100
current_status: IN_PROGRESS
last_completed_checkpoint: C112
next_checkpoint: null
---

# Project Context

Tệp này chỉ giữ trạng thái hiện hành. Quy tắc làm việc nằm trong [AGENTS.md](AGENTS.md), phạm vi
và lịch sử checkpoint nằm trong [roadmap](docs/IMPLEMENTATION_PLAN.md), còn bằng chứng chi tiết nằm
trong các thư mục `docs/*-cXX` và `docs/release-cXX`.

## 1. Trạng thái hiện hành

- C100 `IN_PROGRESS`: OWNER đã phê duyệt tối ưu lời gọi đọc Tổng quan. RPC v4 đã phát hành và đạt
  gate tự động; phần còn lại là nghiệm thu định lượng trên iPhone thật. Không mở checkpoint mới.
- C112 `COMPLETED` ngày 22/10/2026: giao diện C111 cùng nền loading C107 đã được phát hành. OWNER
  đã kiểm cả hai Production alias; Dashboard, Khoản vay, Đối tác và Thông báo đều Auth HTTP 200.
- C101–C112 đều `COMPLETED`. Chi tiết acceptance, test và deployment được giữ trong roadmap và
  báo cáo phát hành tương ứng.
- Không có blocker kỹ thuật hoặc rollout đang chờ. C100 chỉ còn thiếu chuỗi số đo thiết bị theo
  acceptance đã duyệt.

## 2. C100 — Công việc còn lại

Phạm vi: [đề xuất C100](docs/dashboard-rpc-performance-proposal.md) và
[báo cáo hiện hành](docs/dashboard-c100/report.md).

- `get_management_dashboard_bundle_v4` tính một lần cho mỗi khoản vay; v3 vẫn được giữ làm rollback.
- Migration `20261013090000_c100_dashboard_bundle_single_pass.sql` và correction
  `20261013192500` đã áp; remote database lint sạch, parity nghiệp vụ đạt.
- Gate đã đạt: lint, typecheck, unit 123, build 19 route, pgTAP 542/25 file và full E2E
  `87 PASS / 18 SKIP / 0 FAIL`, retries 0. Required CI `38397792297` đạt đủ 5 job.
- Production trước tối ưu: RPC warm median 5319,2 ms; client Khoản vay → Tổng quan median 5811 ms.
- Sau tối ưu: RPC Production warm median 1415,9 ms; client median 3095 ms. Sau khi bỏ prefetch
  suy đoán ở C110, runtime ghi `dashboard.bundle` 1470,8–1566,3 ms và không còn burst request chi
  tiết khoản vay. OWNER ước lượng quay lại Tổng quan khoảng 2–3 giây.
- Acceptance còn thiếu: trên cùng iPhone 16 Pro Max/iOS 26 và cùng mạng, ghi riêng ít nhất 5 lượt
  cold launch và 5 lượt chuyển mục/quay lại Tổng quan. Không dùng cảm nhận chung thay chuỗi số đo.
- Sau khi OWNER cung cấp số đo: cập nhật report/context/roadmap, chạy gate tài liệu, tạo commit chốt
  và chỉ push/đóng C100 khi có phê duyệt phù hợp trong phiên mới.

## 3. Bản đang phục vụ và rollback

| Vai trò | Deployment | Immutable URL / alias | Trạng thái |
| --- | --- | --- | --- |
| Stable Preview C112 | `dpl_2a8avNFZHZxcDsZvheXP84dLu8Ri` | `quan-ly-vay-ca-nhan-74fc7gb9r-ngotuong2105.vercel.app` / `tindung-preview.vercel.app` | Preview, Ready, Functions `sin1` |
| Production C112 | `dpl_75xKhFuJ4wgspCmGdN4txdtNwyVF` | `quan-ly-vay-ca-nhan-967no3d6v-ngotuong2105.vercel.app` / `tindung.vercel.app` / alias mặc định | Production, Ready, Functions `sin1` |
| Preview rollback C110 | `dpl_148HdyQj5mLLoxocf5f3hyhjfDut` | `quan-ly-vay-ca-nhan-6m940n7ty-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |
| Production rollback C106 | `dpl_92pT2tjxRvCTEwyEePzJqMpGa8TG` | `quan-ly-vay-ca-nhan-kt9gxcuu7-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |

C112 đạt lint, typecheck, unit 123, build 19 route và full E2E
`92 PASS / 18 SKIP / 0 FAIL`, retries 0. Hậu kiểm hai Production alias ghi
`dashboard.bundle` 1486,8–1625,8 ms, tất cả `outcome: ok`; không có `57014`, level-error hoặc
HTTP 500. Báo cáo đầy đủ: [release C112](docs/release-c112/report.md).

## 4. Source và workspace

- Repository chuẩn: `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`, branch `main`.
- Các thay đổi hoàn tất C101–C112 được gom trong commit local của phiên dọn dẹp; dùng
  `git log -1 --oneline` để lấy SHA. Chưa push GitHub trong phiên dọn dẹp.
- Chỉ còn worktree chuẩn. Cache build/test đã xóa; `node_modules`, root `.vercel` và backup được
  giữ để phiên mới không phải liên kết lại project hoặc cài lại dependency.
- Không xóa báo cáo checkpoint, migration, test, ảnh bằng chứng đã được source-control quản lý,
  secret hoặc dữ liệu tài chính.

## 5. Bất biến cần giữ

- Supabase PostgreSQL authoritative; Google Sheets chỉ đồng bộ một chiều.
- Mutation qua Server Action/RPC đã validate; financial calculation authoritative ở PostgreSQL.
- VND dùng integer, lãi suất decimal; ngày nghiệp vụ theo Asia/Ho_Chi_Minh, audit theo UTC.
- Giao dịch tài chính dùng append/reversal, không xóa vật lý. Không cache số dư giữa request/user.
- Preview chỉ chạy từ repository root bằng `pnpm deploy:preview` theo
  [runbook](docs/VERCEL_PREVIEW_RUNBOOK.md).
- Project Vercel: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; Supabase project dùng chung:
  `hmfxnstrqfqpvsgfmjmd`. Không tạo dữ liệu QA trên account vận hành.

## 6. Điểm vào phiên mới

1. Đọc `AGENTS.md`, tệp này, [handoff](docs/HANDOFF_NEXT_SESSION.md) và phần C100 trong roadmap.
2. Chạy `git status --short --branch` và `git log -1 --oneline`.
3. Chỉ tiếp tục C100 sau khi OWNER chỉ dẫn rõ trong cuộc trò chuyện mới.
4. Không mở lại C101–C112 hoặc suy quyền thao tác remote từ lịch sử đã hoàn tất.

Tài liệu kỹ thuật chính: [Domain](docs/DOMAIN_SPEC.md), [Financial Engine](docs/FINANCIAL_ENGINE.md),
[Dashboard](docs/DASHBOARD.md), [CI](docs/CI.md), [Preview](docs/VERCEL_PREVIEW_RUNBOOK.md),
[Backup](docs/BACKUP_RESTORE.md) và [Google Sync](docs/GOOGLE_SYNC.md).
