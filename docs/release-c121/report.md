# C121 — Vá Next.js và phát hành sửa cảnh báo kết nối

Trạng thái: `COMPLETED` ngày 20/11/2026, OWNER phê duyệt trực tiếp.

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
- Required CI `44685677028` trên SHA `7cc61c8350c74155465c156f4b1f4d8cfec9485b` đạt đủ 6 job;
  pgTAP 589/28 tệp PASS, E2E hai shard tổng `104 PASS / 19 SKIP / 0 FAIL` (123 test).
  CI skip thêm ca C72 khóa named local container theo điều kiện có sẵn; local vẫn chạy và đạt.
- Root Preview create gate đạt lại lint/typecheck/unit/build và full E2E `105 PASS / 18 SKIP /
  0 FAIL` trong 27,6 phút. Upload metadata guard 249 tệp đạt.

## Remote và rollback

- Không migration, thay secret hoặc ghi dữ liệu tài chính trong C121.
- Re-inspect trước phát hành xác nhận stable Preview C119 `dpl_7R496718rvagozh2HVr4VJxSbtWc`,
  immutable `quan-ly-vay-ca-nhan-66me5s2gb-ngotuong2105.vercel.app`, Preview/Ready/Functions sin1.
- Production C119 `dpl_9max1ga7TvFsS36kSd9sTrWtx6TW`, immutable
  `quan-ly-vay-ca-nhan-6tqp7bep4-ngotuong2105.vercel.app`, Production/Ready/Functions sin1.
- Hai deployment cùng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, scope `ngotuong2105`;
  giữ nguyên làm rollback. Source `7cc61c8350c74155465c156f4b1f4d8cfec9485b` đã push fast-forward
  `effa212..7cc61c8` lên origin/main; Required CI `44685677028` đạt đủ 6 job, đúng SHA.

## Phát hành và hậu kiểm

Full local gate, Required CI đúng SHA và root Preview create gate đã đạt.

Candidate Preview `dpl_FKFHCRhT4czN6pfi9Bpb2NqFu7MV`, immutable URL
`https://quan-ly-vay-ca-nhan-3lozqou67-ngotuong2105.vercel.app` đúng project, target Preview,
Ready, Functions sin1. Public root/login/manifest/sw 200, hai API bảo vệ 401, connectivity 204,
marker đúng, body rỗng, no-store và không set cookie; CSP nonce xoay, script-src không unsafe-inline.
Runtime pre-Auth level-error/fatal/HTTP500 đều bằng 0.
Native Chrome đã mở form login và không có cảnh báo mạng sai. Tab connector không khả dụng trong
chat lúc tạo candidate, không dùng phương thức lấy cookie hoặc credential khác. OWNER sau đó đã
đăng nhập trên IAB. Auth smoke Tổng quan/Khoản vay/Đối tác đạt; network notice không xuất hiện,
loading kết thúc, console error/warning và runtime error/fatal/HTTP500 bằng 0 sau Auth.

Root resume đã chạy sau khi Auth/runtime smoke đạt:

```text
SUPABASE_PROFILE=supabase pnpm deploy:preview -- --candidate https://quan-ly-vay-ca-nhan-3lozqou67-ngotuong2105.vercel.app --verified-authenticated-smoke
```

Root resume đạt full gate `105 PASS / 18 SKIP / 0 FAIL` (27,8 phút), alias chuyển đúng candidate.
Stable public login/manifest/sw 200, hai API bảo vệ 401, connectivity 204/marker/no-store/no-cookie,
CSP nonce xoay/no script unsafe-inline đạt. Runtime error/fatal/HTTP500 bằng 0 sau alias.
Browser stable chưa có session nên dừng ở login hợp lệ, console sạch; không coi đây là Auth smoke
stable. Auth đã kiểm trên immutable cùng deployment. Không rollback.

Production candidate từ root bằng --prod --skip-domain, upload guard 249 tệp đạt:
`dpl_DHfobW9VBsc4BacejizJ1MkDkE8z`, immutable
`https://quan-ly-vay-ca-nhan-1fl65m53k-ngotuong2105.vercel.app`, đúng project/Production/Ready/sin1.
Public root/login/manifest/sw 200, hai API bảo vệ 401, connectivity 204/marker/no-store/no-cookie,
CSP nonce xoay và không script unsafe-inline đạt. Hai alias Production giữ C119 trước promote.
Runtime candidate pre-Auth level-error/fatal/HTTP500 bằng 0, cả ba lệnh log hoàn tất thành công.
Lượt kiểm tra đầu chưa có session đúng origin nên giữ handoff. Sau OWNER đăng nhập lại, IAB tải
được Dashboard candidate và chuyển Khoản vay/Đối tác thành công; không network notice/loading treo,
console error/warning và runtime error/fatal/HTTP500 bằng 0. Re-inspect candidate/rollback và CI
đúng SHA đạt trước `vercel promote`.

Promote thành công. Hai alias `tindung.vercel.app` và
`quan-ly-vay-ca-nhan-ngotuong2105.vercel.app` cùng trỏ `dpl_DHfobW9VBsc4BacejizJ1MkDkE8z`,
target Production, Ready, Functions sin1. Trên cả hai origin, public root/login/manifest/sw 200,
hai API bảo vệ 401, connectivity 204/marker/no-store/no-cookie, CSP nonce xoay/no unsafe-inline đạt.
Runtime sau promote level-error/fatal/HTTP500 bằng 0.

Hậu kiểm Chrome Mac trên tab webapp thật: reload `tindung.vercel.app/dashboard` tải dữ liệu thành
công, không còn cảnh báo, DevTools console 0 message. Đọc navigator.onLine lúc hậu kiểm cho true;
không khẳng định đang false ở thời điểm này. Ca false-offline/recovery được chứng minh trong E2E.
Không đổi VPN, mạng máy người dùng hoặc giả lập kết nối trong tài khoản vận hành. Alias mặc định
chưa có session Chrome nên redirect login hợp lệ; không coi đó là Auth smoke alias mặc định.
Immutable đã Auth smoke và alias chính đã Auth smoke bằng Chrome. IAB kiểm lại Dashboard immutable
sau promote không có notice/loading treo, console sạch; ảnh riêng tư (ẩn số tiền) cung cấp trong chat,
không lưu screenshot hoặc dữ liệu tài chính thật vào source control.

C121 đạt acceptance, không phải rollback; C119 giữ nguyên làm phương án quay lui. Không có blocker
hoặc checkpoint tiếp theo chờ duyệt. Full audit còn 1 moderate minimatch ở dev tooling đã ghi nhận;
không tự nâng major ngoài phạm vi. C100 chỉ còn số đo iPhone theo checkpoint riêng.
