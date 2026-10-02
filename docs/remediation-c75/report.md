# C75 — Remediation ngữ cảnh công việc và thông báo

OWNER phê duyệt C75 trong hội thoại ngày02/10/2026. Startup đã đọc AGENTS/context/checkpoint,
main theo origin/main; bảo toàn toàn bộ thay đổi tài liệu/harness/ảnh C74 chưa commit.

## Kết quả triển khai

| C74 | Thay đổi C75 | Bằng chứng |
|---|---|---|
| F1 MEDIUM | Tên custom và metadata ngày wrap đầy đủ; hướng hiện cạnh loại việc. Không parse chuỗi tùy tiện, không thêm query/schema mới. |6 tổ hợp375/390/1440 light/dark, text clipped0, overflow0; ảnh dashboard. |
| F2 MEDIUM | AttentionItems mở rộng toàn bộ cùng tập nguồn server, thu gọn về5. Nút nằm trước list để giữ focus/scroll, count và aria-expanded/controls đúng. |Fixture13 việc; keyboard Enter và click, đủ13 unique href,5 đầu khớp trước/sau, focus/scroll giữ nguyên. |
| F3 LOW | Metadata heading có các phần/separator riêng; history chỉ render category/separator khi thực sự có category. Không đổi PrivacyRegion toàn cục. |Test tên generated/custom, privacy on/off và attributes; regression privacy C67 đạt. |
| F4 LOW | Unread rỗng có “Bạn đã đọc hết thông báo” và CTA Tất cả; Tất cả thật sự rỗng giữ copy chưa có thông báo. |Fixture local read-all→empty→CTA→read list, sau đó xóa notification disposable để kiểm All rỗng. |
| G1 hierarchy | List/empty trước cấu hình push. Disclosure mặc định đóng, có trạng thái và keyboard Enter; switch/time/test button giữ hành vi. |Ảnh notifications; không requestPermission tự động; PWA test giờ nhận07→09/reload và thông báo thử đạt. |

Ảnh [review.html](review.html) so sánh trước/sau dùng screenshot từ app render thật,
không phải CSS mockup. HTML viewer chưa browser render-verify; giới hạn file:// policy trước đó
được giữ, không dùng workaround. Các PNG sau sửa đã xem trực tiếp bằng công cụ xem ảnh.

Tên quá dài có thể làm card cao hơn. Đây là lựa chọn giữ nhận diện đầy đủ; chưa thêm chế độ
compact desktop (G2 ngoài phạm vi). Grid dashboard align-start để mở rộng list không kéo dài
card dòng tiền thành vùng trắng lớn. Không thay authoritative money/date/calculation.

## File chính

- `apps/web/src/components/business/attention-items.tsx`: state mở/thu gọn tập việc, Button nội bộ.
- `apps/web/src/app/dashboard/page.tsx`: gửi đủ rows giữ thứ tự quá hạn rồi lãi, tên/hướng task.
- `apps/web/src/app/globals.css`: wrap task, metadata, disclosure và align-start dashboard.
- `apps/web/src/app/loans/[id]/page.tsx`: separator heading/history tại call site.
- `apps/web/src/app/notifications/page.tsx`: empty state theo filter, list trước cấu hình.
- `apps/web/src/components/notifications/push-manager.tsx`: disclosure trạng thái; logic quyền,
  subscription, delivery hour không thay đổi.
- `apps/web/test/e2e/c75-remediation.spec.ts`: regression và evidence synthetic.
- `business-flow.spec.ts`: mở disclosure trước kiểm switch/hour/test, mở lại sau reload.
- `c72-remediation.spec.ts`: first task phải nằm trên mobile nav thực thay magic650px khi thêm
  nút expansion; vẫn kiểm overflow/targets, không bỏ kiểm ưu tiên mobile.

## Gate và lịch sử chạy

- Lint/typecheck PASS; unit/script80/80 PASS; `pnpm build` PASS19 route và các lần E2E production
  build PASS. E2E cuối rebuild sau chỉnh CSS align-start.
- Regression C63/C67/C72:19 PASS (3,4 phút tổng cùng2 C75 fail harness lúc đầu).
- Hai lỗi harness C75: locator dùng tên nút cũ sau khi đổi label và beforeAll tạo lại counterpart
  khiến cùng idempotency key khác input. Đã sửa stable locator + reuse counterpart; không sửa
  sản phẩm để né test. Lượt C75 sau2/2 PASS52,2s, six matrix13 tasks/no clipping.
- PWA lọc riêng fail vì bài phụ thuộc suite trước đổi mật khẩu fixture thành123456; file nghiệp
  vụ đầy đủ11/11 PASS1,4 phút, bao gồm PWA/time/test notification. Không đổi mật khẩu remote.
- Lượt chốt C75 gồm thêm explicit-back query và controlled tab loading:3/3 PASS56,8s, exit0;
  production build cuối đạt. Diff-check PASS, hậu kiểm DB0/0/0.
- Chỉ dùng DB disposable API55321/DB55322, baseline đã reset và guard đích. Restart riêng Kong
  test trước run để tránh gateway stale502; không restart resource remote/project anh em.
  Teardown reset local; hậu kiểm profiles/loans/transactions0. Probe xóa notification chỉ là
  dữ liệu synthetic disposable, không xóa lịch sử tài chính.
- Không cần pgTAP/Auth integration mới vì không đổi schema/RPC/Auth. Không tuyên bố full E2E
  suite đã chạy; chỉ các file liên quan và nghiệp vụ như trên. CI/deploy thuộc C76.

## Giới hạn và bước kế tiếp

Chưa rollout Preview/Production, chưa commit/push. Dữ liệu remote/credential/migration/Apps Script/
Sheets không thay đổi. Safari/Firefox/VoiceOver/TalkBack/mobile thật tiếp tục NOT_TESTED mới ở C75.
Cảnh báo Chrome C73 vẫn OPEN; không bypass, đổi security setting hoặc xác nhận nguyên nhân.
Skill ui-ux áp dụng sửa dòng đã chọn, dùng component/token/brand hiện hữu; không redesign toàn app.

C76 đề xuất: đồng bộ C74–C75 và rollout có gate exact SHA/CI, root preview runbook, authenticated
smoke không ghi tài chính, Production sau candidate đạt và hậu kiểm/rollback. Chỉ bắt đầu sau
OWNER phê duyệt checkpoint C76; không tự làm trong C75.

## C76 — Nguồn ảnh sau khi chạy full suite

Full E2E C76 recapture các PNG/evidence sau sửa với25 synthetic tasks (fixture C72 còn trong
suite cùng fixture C75 và baseline). Kết quả sáu tổ hợp vẫn clipped0/overflow0; count/order/
keyboard/privacy/empty/back regression đạt. Các số13 và thời lượng phía trên mô tả lượt gate
riêng của C75; PNG hiện hành là lượt full suite C76. Ảnh trước C74 giữ nguyên fixture13,
vì vậy viewer là đối chiếu hành vi/layout, không phải pixel A/B trên cùng bộ dữ liệu.

C76 release review đã phát hiện và sửa thêm legacy desktop min-height:100% của card dòng tiền
(globals.css1160): align-items:start riêng lẻ chưa đủ. Selector dashboard riêng min-height:0
giữ chart theo nội dung. Regression C75 đo trước/sau expand/collapse ở375/390/1440, light/dark:
desktop429,234375px không đổi, mobile479,46875px không đổi;25tasks vẫn đủ tập, overflow0/clipped0.
Ảnh1440 recapture sau sửa được xem; ảnh lỗi trước sửa giữ tại docs/release-c76/. Trạng thái
full suite/source CI/deployment theo C76; không dùng kết quả C75 để khẳng định rollout đã xong.
