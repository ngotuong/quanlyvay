# C73 — Blocker kiểm tra bảo mật trình duyệt

Ngày kiểm: 02/10/2026. Trạng thái rollout: COMPLETED; phát hiện Chrome còn OPEN, OWNER cho phép tiếp tục.

## Bằng chứng

- Revision `a5cd7b142ae2a8b24247537477ab6437c742be5c` đã push;
  [Required CI run36961824893](https://github.com/ngotuong/quanlyvay/actions/runs/36961824893)
  đạt tất cả job, Auth6/6, E2E44 PASS/4 SKIP. Local/preflight45 PASS/3 SKIP.
- Candidate `dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb`,
  <https://quan-ly-vay-ca-nhan-c6pft4h1k-ngotuong2105.vercel.app>, Ready/preview/sin1,
  đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`. Public smoke đạt.
- Trước đăng nhập, Chrome hiển thị site info bình thường. Sau OWNER tự đăng nhập,
  dashboard render với nội dung/tiền ẩn, task priority mobile390px xuất hiện.
- Chrome gắn nhãn `Nguy hiểm`. Popup site info cảnh báo mật khẩu đã nhập vào trang bị
  coi là lừa đảo; đồng thời ghi chứng chỉ hợp lệ. Nút đánh dấu trang hợp pháp không được bấm.
- [Google Safe Browsing site status](https://transparencyreport.google.com/safe-browsing/search?hl=en&url=quan-ly-vay-ca-nhan-c6pft4h1k-ngotuong2105.vercel.app)
  được mở và đọc trực tiếp trong Chrome, trả `No available data`. Không dùng kết quả này
  để tuyên bố hostname an toàn hoặc bác bỏ cảnh báo.
- Candidate error/HTTP500 log trước authenticated matrix có0 kết quả; không thay thế
  kiểm console/runtime sau đủ route. Tại thời điểm ghi nhận ban đầu, matrix còn thiếu các route và alias hậu kiểm;
  kết quả kiểm tiếp được ghi ở phần quyết định hiện hành bên dưới.

## Đánh giá

Đánh giá ban đầu HIGH đối với cổng phát hành vì cảnh báo credential chưa được giải thích.
Sau chỉ dẫn trực tiếp của OWNER, tiếp tục C73 và giữ phát hiện OPEN/accepted continuation;
không hạ severity hoặc tuyên bố đã xử lý cảnh báo.
Vị trí là UI bảo mật Chrome trên hostname candidate; chưa xác định lỗi trong source ứng dụng.
Không có bằng chứng đủ để kết luận malware, mất mật khẩu hoặc ứng dụng bị xâm nhập.

[Tài liệu chính thức về Password Protection](https://security.googleblog.com/2019/12/better-password-protections-in-chrome.html?hl=en_GB)
mô tả kiểm tra mật khẩu được bảo vệ khi nhập trên site bất thường và phishing verdict.
Đây chỉ là hướng chẩn đoán; chưa xác minh việc tái sử dụng mật khẩu hay verdict cụ thể trên máy này.
[Chrome Help](https://support.google.com/chrome/answer/99020?hl=en) khuyến nghị xử lý cảnh báo,
không tắt Safe Browsing. Chứng chỉ hợp lệ không giải quyết cảnh báo phishing/password.

## Quyết định hiện hành và phần còn lại

OWNER đã nêu cảnh báo không quan trọng và phê duyệt tiếp tục công việc C73. Đây là quyết định
chấp nhận tiếp tục rollout trong khi nguyên nhân còn OPEN; không phải bằng chứng hostname an toàn.
Agent không bấm nút đánh dấu hợp pháp, không bypass interstitial, đổi credential hoặc Safe Browsing.
Trang candidate đang tải và điều hướng bình thường, không có interstitial phải vượt qua.

Authenticated matrix candidate đã kiểm dashboard375/390/1440, light/dark, loan detail/history,
counterparties, expenses, notifications và unread active filter. Sheet mở/đóng sạch, trả focus;
không lưu/mark-read/ghi dữ liệu. Runtime error và HTTP500 sau matrix đều0, CLI exit0.
Console hiện chỉ có CSP Vercel Toolbar; lỗi M_ID trước đó có source chrome-extension.
Navigation render đạt; controlled-delay loading vẫn dựa trên E2E local, không giả lập remote.

Root Preview script đã preflight45 PASS/3 SKIP và promote thành công; public/authenticated alias
hậu kiểm đạt, runtime error/HTTP5000. Stable Preview không hiện badge Nguy hiểm ở lần kiểm này.
Production candidate `dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx` Ready/production/sin1, public smoke đạt;
OWNER đã tự đăng nhập; Auth smoke đạt và `tindung.vercel.app` đã promote/hậu kiểm đạt.
Chỉ hoàn tất C73 khi rollout/hậu kiểm hai môi trường và Required CI SHA tài liệu cuối đạt.
Cảnh báo Chrome vẫn OPEN; thiết bị thật/screen reader tiếp tục NOT_TESTED.

## Kết quả rollout

Production candidate và stable alias đã đạt public/authenticated smoke, viewport3753901440,
light/dark, sheet/filter/return focus; app console/runtime error/HTTP5000 trước/sau promote.
Stable Production trỏ `dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx`; Preview trỏ
`dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb`. Chrome không hiện badge trên hai stable aliases ở lần kiểm,
nhưng badge xuất hiện trên immutable Production sau OWNER login; nguyên nhân vẫn OPEN.
Không dùng rollout thành công để bác bỏ cảnh báo. C74 chỉ được đề xuất, chưa thực hiện.
