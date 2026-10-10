# C96 — Drawer giao dịch từ Dashboard

OWNER đã duyệt C96 ngày10/10/2026 sau C95; mẫu A ở C92 là nguồn thiết kế.
C96 chỉ triển khai local, không push/deploy/remote mutation. Nguồn trước:82151b646a46d514d1dc3ea890e691d48a57b0a0.

- Tác vụ lãi của OWNER/EDITOR là Link giữ href `/loans/id?transaction=interest` cho deep-link,
  tab mới và khi chưa hydrate. Click thường mở ngay Dashboard; VIEWER và gốc quá hạn giữ link chi tiết.
  Link lãi writer không prefetch trang chi tiết. Một provider giữ một selected loan;
  dynamic import drawer chỉ khi chọn, không render hay lấy form/context cho mọi task.
- `GET /api/loans/id/payment-context?date=YYYY-MM-DD` kiểm session/active/password/role và
  Zod theo paymentSchema; dùng client Supabase session/RLS. Response no-store chỉ có identity,
  direction, status, ngày và hai integerstrings từ `calculate_loan`; không ledger/periods/secret.
  Hai business reads nominal: loan SELECT + calculate_loan RPC. Read gateway502/503/504
  được retry tối đa1lần theo helper đã có; auth reads tách khỏi budget business.
- Drawer480px/right16px/top-bottom16px từ1024px; dưới1024 bottom/side12px,
  ngang viewport−24px/cao tối đa viewport−24px. Header/footer cố định trong panel;
  body cuộn. BottomSheet native dialog/focus trap/Escape/drag/dirty-pending primitives giữ.
  Không thay motion chung hoặc snapback/damping C97.
- LoanPaymentForm trích từ LoanActions và dùng chung Server Action/hook/BusinessForm;
  route chi tiết giữ default/reset/chips C95. Dashboard default Tiền lãi, vẫn có selector
  Tiền gốc như form hiện hữu. Nhóm50–200tr chỉ hiện khi chọn Tiền gốc, snapshot bound raw.
  Lãi có “Theo số còn lại” sao chép giá trị integer positive authoritative của ngày đang chọn;
  cập nhật qua React input/dirty/focus, không autosubmit hoặc tính lãi ở frontend.
- Date/read/retry dùng AbortController + alive/request-key, deadline12s. Hủy/đổi khoản/date
  không thể nhận reply cũ. Seed chỉ đặt default đầu phiên; tải lại không ghi đè amount/note.
  Khi số dư chưa sẵn, không hiển thị balance cũ và khóa submit/suggestion; draft vẫn sửa được.
  Lỗi đọc có thử lại; lỗi mutation giữ draft/key và báo theo hook hiện hữu.
- URL hash `#payment=uuid` giữ selected task mà không chuyển route; push/replace giữ Next
  history state và qlvHistoryIndex của DirtyNavigationGuard. Chỉ subscribe popstate/customevent,
  không hashchange thứ hai có thể bypass traversal đang khôi phục. Provider sở hữu draft registry
  cho Dashboard; form không đăng ký lần hai. Dirty close hỏi1lần, Back từ global guard cũng1lần;
  pending chặn Back/close. Rapid selection thay cùng entry. Forward/reload tạo phiên/form/key mới;
  success thay entry về Dashboard để Forward không mở lại submission thành công.
- Save dùng recordPaymentAction/record_financial_transaction unchanged, validate ledger hiện tại,
  khóa/idempotency authoritative. Không conditional-settle theo snapshot và không optimistic money.
  RSC revalidation cập nhật Dashboard/KPI/task; success close/reset/toast/focus. Task vẫn còn
  thì trả trigger; task mất thì focus heading Việc cần xử lý. Lãi task là projection cuối kỳ;
  số dư ngày thanh toán có thể nhỏ hơn task, nên partial/advance không đồng nghĩa task biến mất.
- Privacy chặn click trước GET/form; VIEWER giữ detail chỉ xem và API403. Private DOM/AX dùng
  guard hiện hữu; provider unmount/cancel selected form nếu privacy bật, không giữ draft persistent.

Không schema/migration/RPC/financial engine/action/validation/dependency change. Test/bằng chứng
synthetic chỉ trong C20-test API55321/DB55322; không mainDB54322 hoặc QAdata remote.
Phone thật/AT/nativezoom/SafariFirefox authenticated/OS-theme/remote save NOT_TESTED.
