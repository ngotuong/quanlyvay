---
project: QuanLyVayCaNhan
roadmap_version: 1.0.376
last_updated: 2026-10-24
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C115
current_status: IN_PROGRESS
last_completed_checkpoint: C114
next_checkpoint: C115
---

# Project Context

Tệp này chỉ giữ trạng thái hiện hành. Quy tắc làm việc nằm trong [AGENTS.md](AGENTS.md), phạm vi
và lịch sử checkpoint nằm trong [roadmap](docs/IMPLEMENTATION_PLAN.md), còn bằng chứng chi tiết nằm
trong các thư mục `docs/*-cXX` và `docs/release-cXX`.

## 1. Trạng thái hiện hành

- C113 `COMPLETED` ngày 22/10/2026: audit toàn diện local không phát hiện P0/P1; đã sửa P2 Google
  Sync có thể clear tab khi full snapshot thiếu bảng, P3 biểu đồ vẽ giá trị 0 thành cột dương và
  P3 full E2E C75 tự ghi đè evidence lịch sử.
  Gate đạt lint, typecheck, unit 126, build 19 route, auth 6, pgTAP 543/25 file và full E2E
  `92 PASS / 18 SKIP / 0 FAIL`. Không migration/deploy/commit/push. Báo cáo:
  [audit C113](docs/audit-c113/report.md).
- C114 `COMPLETED` ngày 22/10/2026: Web Push chỉ egress HTTPS/443 tới provider policy qua DNS
  A/AAAA fail-closed và HTTPS Agent ghim IP public; đổi mật khẩu dùng generation + Auth marker để
  recovery partial failure đúng user; CSP Production dùng nonce theo request và bỏ
  `script-src 'unsafe-inline'`. Migration chỉ chạy local. Gate đạt unit 138, build 19 route, Auth 6,
  pgTAP 552/26 file và full E2E `94 PASS / 18 SKIP / 0 FAIL`. Báo cáo:
  [security C114](docs/security-c114/report.md).
- C115 `IN_PROGRESS` ngày 24/10/2026 theo phê duyệt trực tiếp của OWNER: migration C114 đã áp remote;
  provider inventory, stable Preview/Production, Safari/iPhone Web Push, Auth/session, CSP nonce,
  service worker và runtime log đều đạt. Production C115 đang phục vụ trên cả hai alias; C112 là
  rollback đã re-inspect và chưa kích hoạt. Required CI tài liệu sau rollout phát hiện advisory Zod
  mới; bản vá 4.6.7 đã đạt local gate. Harness C99 đã chặn partial prefetch và đạt targeted 3/3;
  run kế tiếp không còn assertion fail nhưng suite tuần tự chạm budget 45 phút ở ca 108/112. CI
  đã được chia hai shard bao phủ đủ 112 test, không tăng timeout/retry/skip. Lượt shard đầu phát
  hiện C107 còn kiểm feedback lần hai sau khi navigation promise đã hoàn tất nên race với teardown
  hợp lệ trên runner tải cao. Harness nay giữ trực tiếp RSC transport 1,1 giây, kiểm feedback trong
  toàn bộ cửa sổ pending rồi mới nhả request; targeted đạt 10/10. Required CI mới chưa được chạy:
  GitHub từ chối khởi động toàn bộ job vì account payment/spending limit, cần OWNER xử lý Billing &
  plans rồi chạy lại đúng source trước khi redeploy.
  Báo cáo:
  [release C115](docs/release-c115/report.md).
- C100 `IN_PROGRESS`: OWNER đã phê duyệt tối ưu lời gọi đọc Tổng quan. RPC v4 đã phát hành và đạt
  gate tự động; phần còn lại là nghiệm thu định lượng trên iPhone thật. C113 không thay đổi phạm vi
  hay acceptance còn thiếu của C100.
- C112 `COMPLETED` ngày 22/10/2026: giao diện C111 cùng nền loading C107 đã được phát hành. OWNER
  đã kiểm cả hai Production alias; Dashboard, Khoản vay, Đối tác và Thông báo đều Auth HTTP 200.
- C101–C114 đều `COMPLETED`; C100 và C115 đang `IN_PROGRESS`. Chi tiết acceptance, test và deployment được giữ trong roadmap và
  báo cáo phát hành tương ứng.
- C115 chỉ còn Required CI hai shard và redeploy Zod 4.6.7; C100 chỉ còn chuỗi số đo thiết bị theo
  acceptance đã duyệt. Các tính năng mới đề xuất C113 vẫn chưa được duyệt.

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
| Stable Preview C115 | `dpl_BRfVm4hf5jfk5FJe2mXPxmrt3hC4` | `quan-ly-vay-ca-nhan-5ydpf15dp-ngotuong2105.vercel.app` / `tindung-preview.vercel.app` | Preview, Ready, Functions `sin1` |
| Preview rollback C115 trước hotfix | `dpl_8pxn5Ze87nbvdNbaF5CQeQ1oan9b` | `quan-ly-vay-ca-nhan-97arw9mvp-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |
| Production C115 | `dpl_GndhsLryK5D15xkut2aHPdeFKGWX` | `quan-ly-vay-ca-nhan-j07u4c057-ngotuong2105.vercel.app` / `tindung.vercel.app` / alias mặc định | Production, Ready, Functions `sin1` |
| Production rollback C112 | `dpl_75xKhFuJ4wgspCmGdN4txdtNwyVF` | `quan-ly-vay-ca-nhan-967no3d6v-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |
| Preview rollback C112 | `dpl_2a8avNFZHZxcDsZvheXP84dLu8Ri` | `quan-ly-vay-ca-nhan-74fc7gb9r-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |
| Preview rollback C110 | `dpl_148HdyQj5mLLoxocf5f3hyhjfDut` | `quan-ly-vay-ca-nhan-6m940n7ty-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |
| Production rollback C106 | `dpl_92pT2tjxRvCTEwyEePzJqMpGa8TG` | `quan-ly-vay-ca-nhan-kt9gxcuu7-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |

C115 đạt lint, typecheck, unit 138, build 19 route, local E2E không lỗi và Required CI đủ 5 job.
Public/Auth/CSP/service-worker smoke đạt trên immutable Production candidate và cả hai alias;
browser console sạch, `dashboard.bundle` hậu kiểm 1652,6 ms với `outcome: ok`, level-error và
HTTP 500 bằng 0. Báo cáo đầy đủ: [release C115](docs/release-c115/report.md).

## 4. Source và workspace

- Repository chuẩn: `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`, branch `main`.
- Source C113–C115, hotfix Next.js 16.4.1 và bằng chứng Preview/iPhone đã fast-forward tới
  `origin/main` tại `9f9f526fed34a39ecfbe4a3b54cd811af4f976d2`; Required CI `39963662481`
  của đúng SHA đạt đủ 5 job. Tài liệu hoàn tất Production C115 là thay đổi chốt hiện tại.
- Dependency và local Supabase test stack được giữ để review/chạy lại gate; không suy quyền thao tác
  remote từ trạng thái local này.
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
3. OWNER xử lý GitHub Billing & plans; sau đó chạy lại Required CI đúng source và redeploy Zod
   4.6.7 cùng các bản vá race harness C99/C107 của C115. Chỉ tiếp tục phần nghiệm thu thiết bị C100
   khi OWNER cung cấp chuỗi số đo hoặc chỉ dẫn rõ.
4. Không tự triển khai tính năng mới C113, commit/push/deploy hoặc suy quyền thao tác remote từ lịch
   sử đã hoàn tất.

Tài liệu kỹ thuật chính: [Domain](docs/DOMAIN_SPEC.md), [Financial Engine](docs/FINANCIAL_ENGINE.md),
[Dashboard](docs/DASHBOARD.md), [CI](docs/CI.md), [Preview](docs/VERCEL_PREVIEW_RUNBOOK.md),
[Backup](docs/BACKUP_RESTORE.md) và [Google Sync](docs/GOOGLE_SYNC.md).
