# C85 — Phát hành UI/theme C83/C84

Trạng thái: IN_PROGRESS. OWNER phê duyệt ngày04/10/2026.

Phạm vi là checkpoint43 roadmap: source C83/C84, CI đúng SHA, root Preview pipeline,
Production candidate/public/Auth/runtime gate trước alias, hậu kiểm stable/default và rollback C82.
Không schema/RPC/remote secret/account/Google, financial submit/mark-read/push permission hoặc cleanup.

## Preflight đang thực hiện

- Lint, unit116, build và typecheck PASS; Node24.15.0/pnpm11.9.0. Máy có pnpm11.19 mặc định;
  dùng npm exec package pnpm11.9.0 với cache trong repository, không đổi global/dependency/lockfile.
- Secret scan pinned Gitleaks diff+tệp text mới: exit0/0finding. Hai literal fixture C83/C84
  trước đây đã chuyển thành UUID idempotency và credential sinh ngẫu nhiên chỉ trong memory của
  test local guarded C20-test. Không rule/ignore mới, không giảm test/assertion/skip/retries.
  Evidence C83/C84 raw2 là lịch sử trước thay đổi harness này, không sửa lại kết quả lịch sử.
- Full E2E local61PASS/12opt-inSKIP9,9m exit0; SQL hậu kiểm sáu bảng0, restore14ảnh C75
  generated exactHEAD. CI37195657702/d10c916 security/quality/policy/pgTAP/Auth PASS,
  E2E59PASS/13SKIP/1FAIL: page.evaluate context destroyed trong matrix. Harness ready(/login) có thể
  đo shell tạm trước authenticated streaming redirect vềdashboard; thêm chờ destination URL,
  không đổi runtime hoặc giảm assertion/retries/skip. Gate đúng source sửa phải chạy lại.
- Local upload metadata guard:165regular files/4.329.225bytes/0forbidden; inventory remote
  chưa kiểm, không tải source/secret/dump bodies để xác minh.
- Remote read-only baseline xác nhận stable Preview C82 dpl_5nqKymiAGKqWGiVMz53B6yx5bfWM,
  Production/default C82 dpl_Gk37QbGPKqxohNNq4qorbHQ89Tiy READY. Chưa tạo candidate/promote.

## Giới hạn

C84 synthetic evidence bổ trợ các state không có dữ liệu remote. Không tạo dữ liệu QA trên
Supabase chung; OWNER tự login nếu thiếu phiên. Physical AT/mobile/authenticated Safari/Firefox
vẫn NOT_TESTED; remote OS-change chỉ kiểm khi browser hỗ trợ, không đổi macOS settings.
Không lưu ảnh/tiền/tên/ID/cookie thật vào Git hoặc log. C85 chưa hoàn tất.
