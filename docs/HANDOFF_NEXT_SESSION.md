# Bàn giao cho cuộc trò chuyện mới

Cập nhật ngày 24/10/2026 trong lúc hoàn tất hotfix release C115.

## Trạng thái cần nhớ

- C115 `IN_PROGRESS` — rollout đầu đạt nhưng Required CI tài liệu phát hiện advisory Zod mới; bản
  vá 4.6.7 đã qua local gate. CI hotfix đầu bị hủy do race C99 partial prefetch; harness đã sửa và
  targeted đạt 3/3, còn Required CI đầy đủ và redeploy Production.
- C100 vẫn `IN_PROGRESS` độc lập — chỉ còn nghiệm thu định lượng trên iPhone thật.
- Checkpoint hoàn tất gần nhất: C114 `COMPLETED`.
- C100 và C115 đang `IN_PROGRESS`; không mở checkpoint mới trước khi C115 hoàn tất.

Cuộc trò chuyện mới phải đọc `AGENTS.md`, `PROJECT_CONTEXT.md` và phần C100 trong
`docs/IMPLEMENTATION_PLAN.md`, rồi chạy `git status --short --branch`. Theo cổng phê duyệt của
repository, không mở checkpoint mới khi chưa có phê duyệt rõ.

## Kết quả C114

- Web Push có provider allowlist, DNS A/AAAA fail-closed và transport pin đúng IP public.
- Password reset dùng generation + protected Auth marker, recovery idempotent và stale proof bị
  từ chối.
- CSP Production dùng nonce per-request, `script-src` không còn `'unsafe-inline'`; PWA/theme/Auth
  tiếp tục hoạt động.
- Gate đạt diff-check, lint, typecheck, unit `138 PASS`, build 19 route, Auth `6 PASS`, schema lint,
  pgTAP `552 PASS / 26 file`, full E2E `94 PASS / 18 SKIP / 0 FAIL` trong 27,7 phút.
- Không thao tác remote. Báo cáo: `docs/security-c114/report.md`.

## Kết quả C113

- Google Sync giờ từ chối full snapshot thiếu/malformed trước khi clear bất kỳ tab nào hoặc tiến
  cursor; đủ test cho 13 dataset và dữ liệu cũ được giữ khi payload lỗi.
- Dashboard, cash-flow và loan interest chart không còn vẽ giá trị 0 thành cột có chiều cao giả;
  tỷ lệ presentation dùng BigInt và privacy vẫn được giữ.
- Full E2E mặc định không còn ghi đè 15 artifact C75; chỉ capture lại khi đặt
  `C75_EVIDENCE=true` có chủ đích.
- Gate đạt: lint, typecheck, unit `126 PASS`, build 19 route, auth `6 PASS`, pgTAP
  `543 PASS / 25 file`, full E2E `92 PASS / 18 SKIP / 0 FAIL`, dependency audit và CI policy.
- Không phát hiện P0/P1. Ba hướng chờ OWNER duyệt checkpoint riêng: egress Web Push theo DNS/IP/
  provider, recovery cho đổi mật khẩu qua Auth+profile và CSP nonce/hash.

Báo cáo đầy đủ: `docs/audit-c113/report.md`.

## C100 còn thiếu gì

RPC v4 và hai migration C100 đã phát hành, giữ v3 làm rollback. Automated gate, Required CI,
Preview/Production, Auth smoke và runtime hậu kiểm đều đạt. Backend hiện khoảng 1,5 giây; OWNER
ước lượng quay lại Tổng quan khoảng 2–3 giây sau khi bỏ prefetch suy đoán.

Acceptance còn thiếu là bằng chứng trên iPhone 16 Pro Max/iOS 26, cùng mạng:

1. Ít nhất 5 số đo cold launch riêng biệt.
2. Ít nhất 5 số đo vòng Khoản vay → Đối tác → Thông báo → Tổng quan.
3. Ghi từng số đo, không thay bằng một khoảng ước lượng chung.

Sau khi có dữ liệu, cập nhật `docs/dashboard-c100/report.md`, `PROJECT_CONTEXT.md` và roadmap;
chạy gate tài liệu rồi mới chốt C100. Phạm vi chi tiết:
`docs/dashboard-rpc-performance-proposal.md`.

## Môi trường đang phục vụ

- Stable Preview C115: `dpl_BRfVm4hf5jfk5FJe2mXPxmrt3hC4` → `tindung-preview.vercel.app`.
- Production C115: `dpl_GndhsLryK5D15xkut2aHPdeFKGWX` → `tindung.vercel.app` và
  `quan-ly-vay-ca-nhan-ngotuong2105.vercel.app`.
- Production rollback C112: `dpl_75xKhFuJ4wgspCmGdN4txdtNwyVF`, chưa kích hoạt.

Public/Auth smoke sáu route đạt trên cả hai Production alias; CSP nonce và service worker đạt,
browser console sạch, runtime không có level-error hoặc HTTP 500. Chi tiết:
`docs/release-c115/report.md`.

## Workspace sau C115

- Repository chuẩn vẫn là `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`, branch `main`; release source
  C115 là `9f9f526fed34a39ecfbe4a3b54cd811af4f976d2`, Required CI `39963662481` đạt đủ 5 job.
- Dependency, root `.vercel`, backup, report checkpoint và bằng chứng source-controlled được giữ.
- Khi nhận bàn giao, chạy `git status --short --branch` và xác minh source/documentation đã đồng bộ
  trước mọi thao tác khác.

Không chạy migration, deploy, đổi alias, push Git hoặc sửa dữ liệu chỉ vì đọc tài liệu bàn giao.
