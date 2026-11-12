# C118 — Rollout lịch nhắc theo tháng và tổng hợp Đối tác

Trạng thái: `IN_PROGRESS` ngày 12/11/2026. Supabase remote và stable Preview đã đạt; đang chờ OWNER
nghiệm thu Preview trước khi tạo Production candidate.

## 1. Backup và migration

- Project: `hmfxnstrqfqpvsgfmjmd` (`Tín Dụng`, `ap-southeast-1`, `ACTIVE_HEALTHY`).
- Backup trước migration: `qlv-prod-20261112T010655Z`; 6 ciphertext, checksum/GCM/SQL-shape và
  manifest đạt, migration version trước rollout `20261022100000`, retention dry-run không xóa gì.
- Dry-run chỉ liệt kê `20261104090000_c117_calendar_reminders_counterparty_financials.sql`.
- Migration đã áp remote; migration history local/remote khớp `20261104090000`; db lint hai schema
  `public,private` không có lỗi.
- Supabase CLI 2.109.0 phát cảnh báo cache `pg-delta` do CA file trong container không tồn tại sau
  khi migration đã commit. Bằng chứng độc lập migration history và remote db lint đều đạt.

## 2. Source và CI

- Release source hiện tại: `0cb155a0d9d2950f973a734bae59e0c6f2418ce9`.
- Push là fast-forward `662573f..0cb155a`, không force push.
- Required CI `43132326300` trên đúng SHA kết luận `success`.

## 3. Stable Preview

| Vai trò | Deployment | URL | Target / trạng thái / region |
| --- | --- | --- | --- |
| Stable Preview C118 | `dpl_J28Soq2TRk2wFpDNBu3YrCkZQaRL` | `https://quan-ly-vay-ca-nhan-7mtj0t1n7-ngotuong2105.vercel.app` / `https://tindung-preview.vercel.app` | Preview / Ready / Functions `sin1` |
| Rollback Preview C115 | `dpl_BRfVm4hf5jfk5FJe2mXPxmrt3hC4` | `https://quan-ly-vay-ca-nhan-5ydpf15dp-ngotuong2105.vercel.app` | Preview / Ready / Functions `sin1` |

- Root create và resume đều chạy từ repository root bằng `pnpm deploy:preview`.
- Mỗi lượt đạt diff-check, lint, typecheck, unit, build 19 route và full E2E
  `96 PASS / 18 SKIP / 0 FAIL` trên 114 test, lần lượt 27,0 và 27,2 phút.
- Candidate đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, org `ngotuong2105`, target Preview,
  Ready và Functions `sin1`. Public smoke `/login`, manifest và hai API bảo vệ đạt.
- Authenticated immutable smoke: Dashboard hiển thị lịch nhắc `01/11/2026–30/11/2026` trong khi kỳ
  báo cáo là `01/11/2026–12/11/2026`; trang Đối tác tải 18 bản ghi với đủ bốn tổng hợp. Privacy và
  bố cục mobile đạt; browser console hai route có 0 error/warning.
- Runtime immutable trước alias: level-error 0, fatal 0, HTTP 500 bằng 0.
- Resume re-inspect rollback cùng project rồi chuyển alias. Hậu kiểm xác nhận stable alias trỏ đúng
  deployment C118, target Preview, Ready, Functions `sin1`; Dashboard/Đối tác Auth smoke và privacy
  đạt, console sạch. Runtime post-alias level-error 0, fatal 0, HTTP 500 bằng 0.

## 4. Cổng còn lại

OWNER cần nghiệm thu trực tiếp trên `https://tindung-preview.vercel.app`:

1. Dashboard: lịch nhắc phủ đúng toàn bộ tháng hiện tại và thao tác xem khoản vay phù hợp.
2. Đối tác: tìm kiếm, bốn số tổng hợp và chế độ riêng tư phù hợp với nhu cầu sử dụng thật.

Chỉ sau xác nhận này mới tạo Production candidate, chạy public/Auth/runtime smoke, promote và hậu
kiểm các Production alias. Production hiện vẫn là C115; chưa có Production deployment/alias mutation
trong C118.
