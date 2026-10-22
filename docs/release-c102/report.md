# C102 — Nghiệm thu và phát hành bản làm gọn Khoản vay

Trạng thái: `COMPLETED` ngày 16/10/2026. Stable Preview đã được OWNER phê duyệt. Production
đã promote sau candidate Auth smoke và qua authenticated hậu kiểm trên cả hai alias.

## Candidate Preview

- Deployment ID: `dpl_HK3NyE9fdgHDtiMcM4WrB3KXToyD`.
- Immutable URL: https://quan-ly-vay-ca-nhan-1sp0xj9bg-ngotuong2105.vercel.app.
- Vercel project: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; target `preview`; trạng thái `READY`;
  46 Functions `sin1`.
- Tạo từ repository root bằng `pnpm deploy:preview`; không dùng deploy trực tiếp từ `apps/web`.
- Stable Preview https://tindung-preview.vercel.app đã trỏ đúng deployment ID trên; inspect sau
  chuyển vẫn trả target `preview`, `READY` và Functions `sin1`.

## Gate và smoke đã đạt

- `git diff --check`, lint, typecheck, unit 123 và build 19 route đạt.
- Full E2E: `87 PASS / 18 SKIP / 0 FAIL` trong 20,6 phút, retries 0. Các skip là nhóm
  audit/capture theo cờ mặc định.
- Resume trước chuyển alias chạy lại toàn bộ gate: `87 PASS / 18 SKIP / 0 FAIL` trong 21,2 phút,
  retries 0; lint, typecheck, unit 123 và build 19 route tiếp tục đạt.
- Upload metadata guard: 249 file đạt.
- Public immutable smoke trong runbook đạt; `vercel inspect` đọc lại đúng deployment/project,
  target Preview, trạng thái Ready và vùng Functions `sin1`.
- Authenticated smoke immutable đạt trên `/dashboard` và `/loans`: route không về `/login`, dữ
  liệu thật tải được, desktop và responsive 375/390 hiển thị badge cùng cụm tên, card mobile gọn,
  không có active-filter pills và select không còn tiền tố nhìn thấy. Nhập rồi xóa search bằng ×
  xóa riêng query và trả focus. Chỉ đọc/đổi filter; không submit hoặc ghi dữ liệu tài chính.
- Browser console không có exception nguồn ứng dụng. Một CSP block của Vercel Toolbar và lỗi từ
  Chrome extension `eppiocemhmnlbhjplcgkofciiegomcon` được phân loại là nguồn ngoài ứng dụng,
  cùng loại ngoại lệ đã ghi trong các release trước.
- Post-alias authenticated smoke `/loans` đạt trên stable hostname. Vercel log ghi request route
  và `auth.user` outcome `ok`; cửa sổ 50 dòng sau lượt kiểm tra không có level error hoặc HTTP 500.
  Đây là kết quả trong cửa sổ smoke, không phải tuyên bố zero-error toàn ứng dụng.
- Các ảnh phát sinh của regression C75 đã được hoàn nguyên về bản tracked; `git diff --check` đạt.

## Cổng còn lại trước Production

OWNER đã phê duyệt giao diện stable Preview trong hội thoại ngày 16/10/2026.

## Candidate Production

- Preflight từ repository root đạt `git diff --check`, lint, typecheck, unit 123, build 19 route và
  full E2E `87 PASS / 18 SKIP / 0 FAIL` trong 20,5 phút, retries 0.
- Upload metadata guard đạt 249 file; các ảnh regression C75 đã hoàn nguyên trước upload.
- Deployment ID: `dpl_GhWLqqTVyDbMGBedbiZ9mGJi5fgK`.
- Immutable URL: https://quan-ly-vay-ca-nhan-ocphof5x6-ngotuong2105.vercel.app.
- Đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `production`, `READY`; 46 Functions,
  danh sách vùng có `sin1`.
- Public smoke đạt `/login` 200, manifest 200 và hai endpoint bảo vệ 401; pre-auth error log không
  có dòng lỗi trong cửa sổ kiểm tra.
- Tạo bằng root `vercel deploy --prod --skip-domain`; alias Production không bị chuyển.
- Rollback hiện tại đã xác minh: `tindung.vercel.app` vẫn trỏ
  `dpl_EGe6nwTAqkZGikDFPzAJT3r85HYf`, target Production, `READY`, 46 Functions và có `sin1`.

## Cổng còn lại trước promote

1. OWNER đăng nhập immutable Production hostname; authenticated read-only smoke `/loans` và route
   liên quan phải đạt, browser console/runtime log không có lỗi ứng dụng hoặc HTTP 500 liên quan.
2. Sau đó mới chạy `vercel promote` candidate và hậu kiểm `tindung.vercel.app` cùng default alias.
   Nếu hậu kiểm thất bại, trả alias về rollback đã xác minh.

## Promote và hậu kiểm

- OWNER đăng nhập immutable Production candidate. Vercel log xác nhận POST `/login` 200,
  `/dashboard`, `/loans`, `/counterparties`, `/notifications` đều 200; `auth.user`, profile,
  notifications và dashboard bundle có outcome `ok`. Không có runtime error/HTTP 500 liên quan.
- Các lượt `auth.user=error` sau đó đến từ tab Chrome phụ không có cookie, được phân biệt theo thời
  điểm và không làm mất bằng chứng phiên OWNER trên candidate.
- Candidate và rollback được inspect lại ngay trước promote. `vercel promote` exit 0.
- `tindung.vercel.app` và `quan-ly-vay-ca-nhan-ngotuong2105.vercel.app` cùng trỏ
  `dpl_GhWLqqTVyDbMGBedbiZ9mGJi5fgK`, target Production, `READY`, 46 Functions và có `sin1`.
- Public smoke đạt 4/4 trên mỗi alias; runtime log không có level error hoặc HTTP 500 trong cửa sổ
  hậu kiểm.
- Cổng còn lại: OWNER đăng nhập cả hai alias để chạy authenticated read-only smoke cuối. Cookie của
  immutable hostname không dùng chung với các alias nên public smoke không thay thế bước này.

OWNER đã đăng nhập cả hai alias. Hậu kiểm cuối xác nhận trên từng hostname:

- `/loans` trả 200;
- `auth.user`, `profile.read` và `loans.page` đều `outcome=ok`;
- không có level error hoặc HTTP 500 trong cửa sổ kiểm tra.

C102 đạt acceptance criteria và hoàn tất. Không ghi dữ liệu tài chính, không thay schema/RPC,
account, secret, Google hoặc backup. C100 tiếp tục là checkpoint đang thực hiện riêng về hiệu năng.
Source và hồ sơ C101/C102 hiện còn trong working tree local cùng thay đổi C100 đã có; C102 không
bao gồm quyền push Git remote nên chưa commit/push. Không thay đổi hoặc hoàn nguyên phần C100.

Không tạo tài khoản smoke hoặc ghi dữ liệu tài chính vì nằm ngoài phạm vi C102. C100 vẫn được OWNER
tự kiểm riêng về hiệu năng và chưa được gộp vào phát hành giao diện này.
