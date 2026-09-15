# Web Workflows

### Ghi chú cập nhật giao diện C20

Server Actions nghiệp vụ và quản trị tài khoản đã gọi `revalidatePath` và trả cây RSC mới;
không gọi thêm `router.refresh()` ngay khi nhận thành công. Thanh điều hướng không ép full
prefetch các trang dữ liệu tài chính sau mỗi lần invalidation. Hai thay đổi này giảm công việc
trùng nhưng không đủ để loại bỏ mọi lần UI giữ trạng thái cũ trong E2E production build local.

Các trang ghi nghiệp vụ có `RenderRevision` do server tạo. Sau khi action xác nhận thành công,
`render-recovery.mjs` kiểm tra sau 3 giây: nếu URL và revision vẫn y nguyên, tải lại document
bằng GET một lần. Nếu cây mới đã commit hoặc người dùng chuyển trang thì không làm gì.
Không gửi lại action/RPC, không tính tiền ở client, không lưu draft hay credential; cảnh báo
`beforeunload` vẫn bảo vệ các form khác chưa lưu. Đây là fallback cho UI không commit, không
phải bằng chứng đã sửa framework; phản hồi thành công được hiển thị trước khi phục hồi.

Triệu chứng local tương tự các báo cáo [Next #97990](https://github.com/vercel/next.js/issues/97990)
và [#96243](https://github.com/vercel/next.js/issues/96243): POST trả dữ liệu mới nhưng transition
không hiển thị. Đây là đối chiếu triệu chứng, không kết luận hai lỗi có cùng nguyên nhân.

## Phạm vi hiện hành

- `/dashboard` là trang mặc định sau đăng nhập; danh sách khoản vay ở `/loans`, chi tiết tại
  `/loans/[id]` và tạo mới tại `/loans/new`.
- Dashboard có bộ lọc kỳ báo cáo bằng URL; số dư chốt cuối kỳ, còn lãi/chi phí/dòng tiền giới hạn
  trong kỳ. Dư nợ cho vay đang hoạt động, nợ xấu và tổng vốn chưa thu hồi được trình bày riêng.
- `/loans` mặc định lọc `ACTIVE`; `status=ALL` hiển thị tất cả. Trang tìm theo tên khoản/đối
  tác; lọc hướng, trạng thái, ngày giải ngân; sắp xếp mới/cũ, dư nợ
  và tên. Chỉ filter đang áp dụng hiện thành chip xóa nhanh; trạng thái nằm trong query string để hỗ
  trợ quay lại và deep link. Tìm kiếm debounce 300 ms; select, ngày và sắp xếp cập nhật ngay, không
  có bước Áp dụng. Card đặt tên–gốc và tag trên hàng đầu; tiếp theo là ngày giải ngân, lãi suất, ngày
  đóng lãi và ba chỉ số authoritative: dư nợ gốc, lãi phải thu/trả, lãi đã thu/trả. Thẻ
  `SETTLED` thay lịch đóng lãi bằng `settled_on` với nhãn **Ngày tất toán**.
- Chi tiết khoản vay chia bốn tab URL: Tổng quan, Các kỳ lãi, Lịch sử, Thiết lập. Tổng quan có hero
  dư nợ/việc kế tiếp/trạng thái, nút **Ghi giao dịch** và nút đỏ **Tất toán** cạnh nhau; mỗi thao tác
  mở một sheet riêng và lặp lại ngữ cảnh khoản vay. Dưới ba kỳ dùng summary thay chart. Tab thiết
  lập chỉ chứa điều khoản hiện tại, chỉnh sửa thông tin, điều chỉnh nghiệp vụ và vùng nâng cao cho
  dữ liệu cũ/sửa sai; hoàn tác tất toán được cô lập trong vùng nguy hiểm.
- Quản lý đối tác tại `/counterparties`; OWNER chỉ xóa được đối tác chưa có lịch sử khoản vay.
- Ghi nhận tiền lãi, tiền gốc, chi phí, thay đổi lãi suất, nợ xấu, bật lại tính lãi và tất toán.
- Mỗi card kỳ lãi có form điền nhanh số dư lãi còn phải đóng và ngày dự kiến thu. Người dùng được
  sửa ngày/số tiền; ngày ngoài khoảng kỳ có cảnh báo và vẫn tuân theo quy tắc phân kỳ bằng ngày giao
  dịch của engine.
- Mọi ô tiền VND tự định dạng dấu chấm hàng nghìn nhưng Server Action vẫn chuẩn hóa về chuỗi số
  nguyên trước RPC. Form tạo khoản không chọn sẵn hướng; `Cho vay`/`Đi vay` là lựa chọn bắt buộc.
- Chi phí không gắn khoản vay được nhập, xem và đảo tại `/expenses`.
- Giao dịch tài chính chỉ được sửa sai bằng thao tác đảo; giao dịch gốc vẫn còn trong timeline.
- OWNER xem audit log sanitized tại `/audit`, phân trang 25 dòng qua URL; EDITOR và VIEWER không
  truy cập được. UI không đọc raw `endpoint`, `p256dh` hoặc `auth_secret`.
- OWNER quản lý các tài khoản EDITOR/VIEWER và mật khẩu tạm tại `/settings`; tài khoản đang hoạt
  động được ưu tiên, còn tài khoản ngừng hoạt động được thu gọn trong nhóm lưu dấu vết/audit.
- VIEWER xem được toàn bộ nghiệp vụ nhưng không thấy các biểu mẫu thay đổi dữ liệu.
- C20 bỏ hoàn toàn VietQR/phiếu văn bản; giữ các form ghi nhận tiền và lịch sử.
- `/account` dành cho mọi vai trò; quản trị tại `/settings` vẫn chỉ OWNER.
- Danh sách khoản vay, chi phí, đối tác, kỳ lãi và lịch sử dùng page 25; thông báo có page và lọc
  chưa đọc. Tổng chi phí/phân bổ lấy từ RPC cho toàn bộ dữ liệu, không cộng trên page đang xem.
- Tìm/chọn đối tác có thêm nhanh trong dialog, giữ form khoản vay. Lỗi form giữ dữ liệu, focus
  trường sai và liên kết thông báo; rời form có thay đổi sẽ yêu cầu xác nhận.
- Privacy mặc định bật khi chưa có cookie; che cả nội dung tự do và từ khóa tìm kiếm. Muốn nhập
  nghiệp vụ hoặc tìm theo tên phải chủ động hiện nội dung. Cookie giúp SSR không chớp tiền.

## Ranh giới dữ liệu

Mọi input từ web được validate bằng Zod trong Server Actions. Các thao tác tiền và lifecycle gọi RPC
PostgreSQL; frontend không tự tính dư nợ hoặc lãi. Migration C6 bổ sung các RPC:

- `create_counterparty`, `update_counterparty`, `delete_counterparty`
- `create_loan_v2`: tạo khoản vay và giao dịch giải ngân trong cùng transaction, nhận lãi suất của
  cả chu kỳ, tự sinh nhãn khi người dùng để trống và có idempotency key
- `update_loan_details`: sửa nhãn tùy chọn, đối tác và ghi chú; nhãn trống được tự sinh lại
- `correct_loan_terms`: luồng chuyên biệt để sửa dữ liệu khởi tạo nhập sai. RPC khóa khoản vay, cập
  nhật điều khoản có audit, đảo giải ngân cũ, thêm giải ngân thay thế và rebuild lãi trong cùng
  transaction; lý do và idempotency key là bắt buộc
- `get_loan_term_summary`: trả lãi suất cả kỳ và tiền lãi của một kỳ đầu đủ ngày từ PostgreSQL
- `get_loan_management_summary`: trả tổng lãi phát sinh, tổng lãi đã thu/trả và gốc đã hoàn trả,
  gồm cả số lãi lịch sử từ onboarding khoản cũ nhưng loại giao dịch đã đảo
- `get_management_analytics`: trả lãi phát sinh theo hướng và top 10 mức tập trung theo đối tác
- `record_expense`: tạo transaction và category chi phí nguyên tử; khóa idempotency kiểm tra cả
  khoản vay, ngày, số tiền, nhóm chi phí và ghi chú
- `reverse_settlement`: hoàn tác nguyên lần tất toán bằng các reversal đúng batch và một ledger
  append-only; không cho đảo lẻ gốc/lãi do tất toán tạo ra
- `get_general_expenses_page`: tổng và category đầy đủ, xác định reversal ở server, page 25.
- `list_loan_summaries_page`: filter/sort ổn định, tổng số đếm, không gửi periods trong card.
- `preview_settlement` / `settle_loan_confirmed`: xem gốc/lãi/tổng theo ngày; lúc ghi khóa khoản
  vay và tính lại, từ chối nếu khác số tiền đã xác nhận. Tải lại preview bắt buộc xác nhận lại.

Role `authenticated` chỉ có quyền đọc trực tiếp theo RLS. Mutation hồ sơ, đối tác, khoản vay,
subscription và sổ tài chính phải đi qua RPC có validation; hai RPC v1 nhận lãi `%/ngày` không còn
được cấp cho client.

## Trải nghiệm giao diện

- Mobile dùng một `h1` trong header theo tên/icon module hiện tại, ẩn heading module lặp trong nội
  dung và có bottom navigation bốn mục chính và menu “Thêm”; desktop từ 1024px dùng
  sidebar và vẫn giữ heading nội dung.
- Mọi vùng mở rộng dùng dấu `+` khi đóng, `−` khi mở và canh giữa theo nhãn.
- Form có label hiển thị, thông báo lỗi gần trường, loading state và touch target tối thiểu 44px.
- Form nợ xấu gọi mốc hiệu lực là **Ngày cuối cùng còn tính lãi** và nói rõ ngừng lãi từ ngày kế tiếp,
  tránh làm mất kỳ cuối chưa đóng.
- Trạng thái không chỉ biểu diễn bằng màu mà luôn có nhãn chữ.
- Giao dịch đảo (kể cả chi phí chung), xóa đối tác và tất toán đều yêu cầu xác nhận.
- Khoản đã tất toán hiển thị thao tác nguy hiểm **Hoàn tác toàn bộ tất toán**, bắt buộc lý do và
  checkbox xác nhận; lịch sử settlement cũ vẫn được giữ nguyên.
- Sửa dữ liệu ban đầu nằm trong vùng mở rộng riêng, hiển thị cảnh báo, bắt buộc lý do và checkbox
  xác nhận. Khoản đã tất toán không hiển thị thao tác này.
- `loading.tsx` cung cấp skeleton khi route đang tải; reduced-motion được tôn trọng.

## Kiểm thử

```bash
node scripts/test-environment.cjs
# Chỉ chạy Supabase trong .cache/c20-test (project và port riêng)
pnpm test:e2e
```

Playwright build rồi chạy Next.js Production **trên local** bằng Google Chrome tại cổng `3101`,
với biến môi trường database test được cấp từ harness; tạo tài khoản giả, chạy nghiệp vụ và reset
database khi kết thúc. Không chạy bộ test này trên database có dữ liệu thật. Không chạy Auth/DB/E2E
đồng thời vì chúng dùng chung database test và có reset/fixture. Build thông thường cũng không
chạy song song E2E vì cùng sử dụng `.next`.
