# C24 — Rollout Production C20–C23

Ngày phê duyệt: 2026-09-11. Trạng thái: `COMPLETED`.

Production deployment: `dpl_GPWF8qZJPFdRbtBpp9awZAZtuGtC`, immutable
`https://quan-ly-vay-ca-nhan-l6dmwcbvz-ngotuong2105.vercel.app`, target `production`, `Ready`;
mọi Function có `sin1`. Stable `https://tindung.vercel.app` đã trỏ đúng deployment này. Rollback
target được xác minh trước promote: `dpl_4o6JerspEoJUbgu3qXr27twuZZSd`.

Gate đạt: 73/73 unit/script tests, Auth 6/6, E2E 21/21, build/lint/typecheck, DB lint và pgTAP
443/443. Public/authenticated smoke trên immutable URL và stable domain đều đạt; console và Vercel
error log sạch. Production dùng cùng Supabase `hmfxnstrqfqpvsgfmjmd` đã đủ 29/29 migration nên
không chạy migration lần hai và không phát sinh database mutation trong C24.

## Mục tiêu

- Đưa source đã nghiệm thu từ C20–C23 lên `https://tindung.vercel.app`.
- Giữ Production cũ là rollback target cho đến khi candidate và stable domain đều qua hậu kiểm.
- Không làm mất dữ liệu, không xóa audit và không thay đổi Google resources.

## Quy trình

1. Xác minh Production deployment cũ, Vercel project, region, database đích và migration state.
2. Nếu database Production chưa có migration cần thiết: tạo logical backup đạt integrity gate,
   sau đó chỉ áp migration còn thiếu. Nếu Production dùng cùng database đã đủ 29 migration
   thì không chạy migration lần hai.
3. Chạy `git diff --check`, lint, typecheck, unit tests, build, Auth, E2E, DB lint và pgTAP.
4. Tạo Vercel Production candidate từ repository root bằng `--prod --skip-domain`; xác minh đúng
   project, target `production`, trạng thái `Ready` và Functions `sin1`.
5. Chạy public/authenticated smoke trên immutable URL, bao gồm dashboard, số liệu, auth,
   danh sách và Google Sync isolation; chỉ promote khi tất cả đạt.
6. Promote candidate, smoke lại `tindung.vercel.app`, kiểm tra runtime error log; rollback về
   deployment cũ nếu hậu kiểm thất bại.

## Acceptance criteria

- Production stable trỏ đúng candidate đã xác minh, `Ready`, target `production`, Functions `sin1`.
- Toàn bộ gate local/DB đạt; authenticated smoke trên immutable URL và stable domain đạt;
  console và Vercel error log không có lỗi mới.
- Số liệu C23 khớp baseline đã duyệt; dữ liệu QA không xuất hiện trong luồng vận hành.
- Tài khoản smoke tạm bị deactivate/ban sau test; credential tạm không lưu trong Git.
- Ghi deployment ID, immutable URL, rollback target, region và kết quả hậu kiểm vào context.

## Ngoài phạm vi

- Không Git push, không `clasp push/deploy`, không sửa Google Sheet/Drive/trigger hay remote secret.
- Không thay đổi schema ngoài các migration đã nghiệm thu C20–C23.
