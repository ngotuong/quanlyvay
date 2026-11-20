# C121 — Vá Next.js và phát hành sửa cảnh báo kết nối

Trạng thái: `IN_PROGRESS`, OWNER phê duyệt trực tiếp ngày 20/11/2026.

## Source và dependency

- C120 đã sửa NetworkStatus, endpoint `/api/connectivity` không Auth/DB/cookie/cache và bộ E2E.
- Next.js và eslint-config-next nâng từ 16.4.1 lên 16.4.6, bản patch mới nhất trong nhánh 16.4
  tại lúc kiểm tra registry chính thức. React và nghiệp vụ giữ nguyên.
- Chuyển nguyên patch get-root-dirs/tinyglobby C76 sang plugin 16.4.6; giữ nguyên các regression
  assertions. Cập nhật lockfile và các pin theo đúng version, không bỏ security policy.
- `pnpm audit --prod`: không có lỗ hổng đã biết. Full audit còn 1 moderate minimatch qua tooling
  typescript-eslint, không thuộc runtime; 0 high/critical, gate audit-level high đạt. Không tự nâng
  major minimatch ngoài phạm vi đã duyệt; ghi nhận làm đề xuất riêng nếu cần.
- Lint/typecheck/unit/build (gồm endpoint mới) đạt; không còn build guard của Next.js
  16.4.1. CI policy đạt. Full local E2E source cuối đạt `105 PASS / 18 SKIP / 0 FAIL` trên 123
  test trong 27,6 phút, retries 0; đã chờ teardown thành công trước bước tiếp theo.

## Remote và rollback

- Không migration, thay secret hoặc ghi dữ liệu tài chính trong C121.
- Re-inspect trước phát hành xác nhận stable Preview C119 `dpl_7R496718rvagozh2HVr4VJxSbtWc`,
  immutable `quan-ly-vay-ca-nhan-66me5s2gb-ngotuong2105.vercel.app`, Preview/Ready/Functions sin1.
- Production C119 `dpl_9max1ga7TvFsS36kSd9sTrWtx6TW`, immutable
  `quan-ly-vay-ca-nhan-6tqp7bep4-ngotuong2105.vercel.app`, Production/Ready/Functions sin1.
- Hai deployment cùng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, scope `ngotuong2105`;
  giữ nguyên làm rollback. Chưa push hoặc thay alias trong C121.

## Còn lại

Full local gate đã đạt; tiếp tục commit/push fast-forward và chờ Required CI đúng SHA. Sau đó root
`pnpm deploy:preview`, immutable public/Auth/runtime smoke trước root resume/stable alias;
Production candidate qua --prod --skip-domain rồi Auth/runtime/promote/hậu kiểm hai alias.
Đối chiếu trên Chrome đã báo false-offline; không ghi nghiệp vụ hoặc đổi cấu hình mạng người dùng.
