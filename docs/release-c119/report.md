# C119 — Mở chu kỳ lãi từ ngày hiệu lực

Trạng thái: `COMPLETED` ngày 13/11/2026, OWNER phê duyệt trực tiếp triển khai và áp dụng khoản vay đã chỉ định.

## Nghiệp vụ

- Sự kiện mở chu kỳ được lưu bằng ledger append-only có audit/RLS, gắn với sự kiện đổi/bật lại lãi.
- Có thể gắn mốc kỳ vào sự kiện đổi lãi đã có cùng ngày nếu mức lãi khớp; không tạo dòng tiền hoặc
  sự kiện lãi trùng. Retry kiểm tra cùng khoản/ngày/loại/mức lãi và chỉ lưu một lần.
- Engine cắt kỳ trước tại D-1 và mở kỳ mới từ D. Helper mốc lịch dùng chung cho khoản vay,
  Dashboard và thông báo. Lịch tháng tính lại khi ngày dự kiến từ mốc cũ đi qua mốc mới.
- UI bổ sung checkbox trong form nghiệp vụ hiện có và dòng mốc mới trong lịch sử; giữ offset nhắc.
- Export bổ sung dataset `interestCycleResets`, giữ nguyên các dataset và workbook hiện hữu.

## Kiểm chứng đã thực hiện

- Lint, typecheck, unit và build 19 route đạt trước lượt full release gate.
- pgTAP bản chốt: 589 PASS/28 tệp, gồm ca lịch tháng và retry lãi suất chia ra số thập phân dài.
- Targeted E2E C119: 1 PASS/1,2 phút; gắn mốc mới vào rate event có sẵn qua form, xác minh lịch sử,
  lịch kết thúc và không nhân đôi rate event.
- Full E2E thăm dò được chủ động ngắt sau 23 PASS khi bổ sung bản sửa lịch tháng; không coi lượt
  interrupted này là gate phát hành. Một lần targeted khởi động quá sớm trong teardown bị từ chối
  vì container đang starting; chạy lại sau teardown đạt. Không tăng timeout/retry/skip.
- Backup mới `qlv-prod-20261112T130014Z`: 6 tệp mã hóa; checksum/GCM/SQL-shape đạt; remote migration
  trước rollout `20261104090000`. Retention chỉ dry-run, không xóa backup.

## Phát hành

Source `effa212d64f010e23e4b3bbc576b63ae5aa5bbe5` đã lên `origin/main`. Required CI `43257277803`
đạt đủ sáu job; hai shard kết thúc trong 12m44s và 28m25s. Lượt root tạo Preview từ repository root
đạt diff-check/lint/typecheck/unit/build và full E2E `97 PASS / 18 SKIP / 0 FAIL`, 115 test, 27,3 phút.
Upload guard 248 tệp đạt. Các lượt trước được thay thế khi cập nhật hợp đồng export và so sánh rate
theo numeric(18,10); không tăng timeout/retry/skip hoặc bỏ assertion kiểm danh sách dataset.

Migration `20261112130000` đã áp đúng project `hmfxnstrqfqpvsgfmjmd`; migration history local/remote
khớp và db lint public/private sạch. CLI phát cảnh báo cache pg-delta thiếu CA file sau commit giống
C118; không bỏ xác minh certificate, bằng chứng history và lint độc lập đều đạt.

| Vai trò | Deployment | URL | Trạng thái |
| --- | --- | --- | --- |
| Stable Preview C119 | `dpl_7R496718rvagozh2HVr4VJxSbtWc` | `https://quan-ly-vay-ca-nhan-66me5s2gb-ngotuong2105.vercel.app` / `https://tindung-preview.vercel.app` | Preview / Ready / Functions sin1, public/Auth/runtime đạt |
| Preview rollback C118 | `dpl_J28Soq2TRk2wFpDNBu3YrCkZQaRL` | `https://quan-ly-vay-ca-nhan-7mtj0t1n7-ngotuong2105.vercel.app` | Giữ nguyên |
| Production C119 | `dpl_9max1ga7TvFsS36kSd9sTrWtx6TW` | `https://quan-ly-vay-ca-nhan-6tqp7bep4-ngotuong2105.vercel.app` / `https://tindung.vercel.app` / alias mặc định | Production / Ready / Functions sin1, public/Auth/runtime đạt |
| Production rollback C118 | `dpl_9stGwkm8nA4bhiKcDXZySmrukhtr` | `https://quan-ly-vay-ca-nhan-leq38ew90-ngotuong2105.vercel.app` | Ready/sin1, giữ nguyên |

Public immutable smoke: root/login/manifest/sw 200, hai API bảo vệ 401. CSP script-src có nonce
riêng theo request và không có unsafe-inline; runtime level-error/fatal/HTTP500 đều 0 trước Auth.
OWNER đã đăng nhập Preview; form Thiết lập, Lịch sử và Dashboard đạt, không ghi thử nghiệp vụ trên
database dùng chung. Root resume đã chạy thành công bằng:

```text
pnpm deploy:preview -- --candidate https://quan-ly-vay-ca-nhan-66me5s2gb-ngotuong2105.vercel.app --verified-authenticated-smoke
```

Root resume đạt diff-check/lint/typecheck/unit/build 19 route và full E2E `97 PASS / 18 SKIP /
0 FAIL` trong 27,4 phút; alias chuyển đúng candidate. Stable Preview Dashboard/Thiết lập Auth smoke,
console và runtime error/fatal/HTTP500 bằng 0 sau chuyển alias.

Production candidate đã tạo từ root bằng `--prod --skip-domain` sau upload metadata guard 248 tệp.
Inspect xác nhận đúng project, Production/Ready/Functions sin1; public root/login/manifest/sw 200,
hai API bảo vệ 401; CSP nonce xoay theo request và không có script unsafe-inline. Runtime pre-Auth
error/fatal/HTTP500 bằng 0. Sau OWNER đăng nhập, immutable Dashboard/Thiết lập/Lịch sử tải đúng,
checkbox mốc kỳ hiển thị và browser console error/warning bằng 0. Runtime error/fatal/HTTP500
vẫn bằng 0 trước promote. Re-inspect rollback đúng C118 rồi `vercel promote` thành công.

Hai alias `tindung.vercel.app` và `quan-ly-vay-ca-nhan-ngotuong2105.vercel.app` cùng trỏ C119,
Production/Ready/Functions sin1. Hậu kiểm public statuses/CSP đạt; Auth chi tiết khoản vay trên
alias chính và Dashboard trên alias mặc định đạt, console sạch. Runtime sau promote và sau ghi
nghiệp vụ có error/fatal/HTTP500 bằng 0. Không phải rollback; C118 giữ nguyên làm phương án quay lui.

OWNER đã đăng nhập immutable Preview: Dashboard, Thiết lập (checkbox mốc mới) và Lịch sử tải
thành công; browser console error/warning và runtime error/fatal/HTTP500 bằng 0. Không ghi thử vào
database vận hành. OWNER bổ sung yêu cầu khoản được chỉ định không nhắc sớm ở kỳ mới.

## Đối chiếu nghiệp vụ được chỉ định

- Ngay trước ghi, kiểm tra lại trạng thái hoạt động, chu kỳ và lịch sử miễn/đổi lãi; không có xung đột
  hoặc sự kiện mới hơn ngày yêu cầu. Ghi nhận số dư gốc, lãi đã thu, lãi phát sinh để đối chiếu.
- Dùng form Production và RPC v3 để gắn mốc mới vào đúng rate event cùng ngày/mức lãi đã có.
  UI xác nhận thành công; Lịch sử chỉ có một rate event tại ngày đó và thêm dòng mốc chu kỳ.
- Dùng form chỉnh thông tin/RPC hiện hữu đặt offset 0 theo yêu cầu riêng, giữ đối tác/nhãn/ghi chú
  và các điều khoản khác. UI xác nhận thành công, Thiết lập hiển thị nhắc sớm 0 ngày.
- Tổng quan hiển thị đúng ngày nhắc cuối kỳ mới; Các kỳ lãi xác nhận đoạn miễn lãi trước mốc mới
  vẫn bằng 0, đoạn mới bắt đầu đúng ngày hiệu lực. Dư gốc, lãi đã thu và tổng lãi phát sinh không đổi
  khi chỉ đổi anchor/offset. Không tạo thanh toán hoặc dòng tiền giả, không sửa giao dịch đã thu.
- Không lưu tên, loan ID, số tiền vận hành hoặc ảnh có dữ liệu thật trong source control. Bằng chứng
  riêng tư đã cung cấp trong hội thoại; chế độ riêng tư trên app được bật lại sau đối chiếu.

C119 đạt toàn bộ acceptance; không có blocker. Chưa có checkpoint kế tiếp để phê duyệt. C100
tiếp tục chờ chuỗi số đo thiết bị theo phạm vi đã duyệt, không tự mở rộng trong C119.
