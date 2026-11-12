# C118 — Rollout lịch nhắc theo tháng và tổng hợp Đối tác

Trạng thái: `COMPLETED` ngày 12/11/2026. Supabase remote, stable Preview và Production đều đạt;
rollback C115 được giữ nguyên, chưa kích hoạt.

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

- Release source ứng dụng: `0cb155a0d9d2950f973a734bae59e0c6f2418ce9`; source bằng chứng
  trước Production: `0476ae53a1f54a393df2aa07796fff0775fc6cc4`.
- Push là fast-forward `662573f..0cb155a`, không force push.
- Required CI `43140849695` trên đúng SHA `0476ae5` kết luận `success`; đủ sáu job, gồm hai shard E2E.

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

## 4. Production

OWNER đã nghiệm thu stable Preview trong hội thoại trước khi tạo Production candidate.

| Vai trò | Deployment | URL | Target / trạng thái / region |
| --- | --- | --- | --- |
| Production C118 | `dpl_9stGwkm8nA4bhiKcDXZySmrukhtr` | `https://quan-ly-vay-ca-nhan-leq38ew90-ngotuong2105.vercel.app` / `https://tindung.vercel.app` / alias mặc định | Production / Ready / Functions `sin1` |
| Rollback Production C115 | `dpl_4L1ayzFPjaaAJjUtXms3gB3v1HEx` | `https://quan-ly-vay-ca-nhan-hfp6yuep3-ngotuong2105.vercel.app` | Production / Ready / Functions `sin1`, chưa kích hoạt |

- Candidate được tạo từ repository root bằng `vercel deploy --prod --skip-domain`; upload guard đạt
  248 tệp. Trước promote, hai alias vẫn trỏ rollback C115 và cả candidate/rollback đều được re-inspect.
- Public immutable smoke đạt: `/`, `/login`, manifest và service worker trả 200; hai API bảo vệ trả
  401. CSP có nonce riêng từng request, `script-src` không có `unsafe-inline`.
- Auth immutable smoke đạt: Dashboard hiển thị kỳ báo cáo 01–12/11 và lịch nhắc 01–30/11; Đối tác
  tải 18 bản ghi, đủ bốn tổng hợp, privacy hoạt động; console error/warning bằng 0.
- Runtime candidate trước promote: level-error 0, fatal 0, HTTP 500 bằng 0. `vercel promote` thành công.
- Hậu kiểm xác nhận `tindung.vercel.app` và alias mặc định cùng trỏ deployment C118, target Production,
  Ready, Functions `sin1`. Public status/CSP giữ nguyên; Auth Dashboard/Đối tác đạt, console sạch;
  privacy được bật trên cả hai origin. Runtime post-promote level-error/fatal/HTTP 500 bằng 0.

## 5. Kết luận

C118 đạt toàn bộ acceptance. Không rollback vì hậu kiểm sạch; nếu cần quay lui, deployment C115 ở
trên đã được xác minh Ready và chưa bị thay đổi.
