# C29 — Rollout C27/C27A lên Production

Ngày phê duyệt: 2026-09-13. Hoàn tất: 2026-09-13. Trạng thái: `COMPLETED`.

Production deployment: `dpl_3kKvGQd5Ym6GjjJRdZm6d2YMwQFx`, immutable
`https://quan-ly-vay-ca-nhan-ifzext0p6-ngotuong2105.vercel.app`, target `production`, `Ready`,
đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`. 43 Function ứng dụng ở `sin1`; middleware
toàn cầu cũng có `sin1`. Stable `https://tindung.vercel.app` đã trỏ đúng deployment này. Rollback
target được xác minh trước promote là C26 `dpl_66uiiExUfXXNnS3KCajLhNmgkqyw` và không phải kích hoạt.

Gate đạt: `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6 và E2E
21/21. Public smoke immutable/stable đạt (`/login` 200, manifest 200, Google export 401,
notification runner 401). Authenticated smoke trên cả hai URL đạt 6 route chính, Quick
Action/BottomSheet, menu mobile, chống tràn ngang, logo/favicon/Apple/PWA icon; browser console
sạch. Runtime log candidate và hậu kiểm có 0 error, 0 fatal.

Hai tài khoản EDITOR smoke đã bị deactivate/ban; không tạo giao dịch hay dữ liệu tài chính.
Credential tạm và bằng chứng cache có dữ liệu thật đã được xóa. Không chạy DB gate/migration vì
checkpoint không đổi database; Auth/E2E đã reset đủ 29 migration local. Không đổi Supabase/Google
resources, remote secret hoặc Git remote và không Git push.

## Phạm vi và acceptance criteria

1. Chạy `git diff --check`, lint, typecheck, unit/script tests, build, Auth và E2E trước candidate.
2. Xác minh Production stable hiện tại, đúng Vercel project và lưu deployment C26 làm rollback.
3. Tạo Production candidate từ repository root bằng `--prod --skip-domain`; xác minh đúng project
   `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `production`, trạng thái `Ready` và Functions `sin1`.
4. Public và authenticated smoke immutable URL, gồm các route chính, Quick Action/BottomSheet,
   mobile menu, chống tràn ngang, bộ nhận diện mới, favicon/Apple/PWA icon và browser console.
5. Chỉ promote sau khi candidate đạt toàn bộ gate; smoke lại `https://tindung.vercel.app`, kiểm tra
   alias và runtime error log. Nếu hậu kiểm thất bại, trả alias về deployment C26 đã xác minh.
6. Tài khoản smoke tạm phải bị deactivate/ban; không tạo giao dịch hoặc dữ liệu tài chính và không
   lưu credential tạm trong repository.
7. Ghi deployment ID, immutable URL, rollback target, target, region, từng gate và kết quả smoke
   vào tài liệu này cùng `PROJECT_CONTEXT.md`.

## Ngoài phạm vi

- Không migration, thay schema, dữ liệu nghiệp vụ, remote secret hoặc Supabase resource.
- Không `clasp push/deploy`, thay Google Sheet/Drive/trigger, Git push hoặc sửa Git remote.
