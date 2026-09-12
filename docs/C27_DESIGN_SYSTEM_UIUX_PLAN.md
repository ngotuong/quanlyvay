# Kế hoạch C27 — Chuẩn hóa Design System và Tối ưu UI/UX Frontend

## 1. Bối cảnh và Mục tiêu

Dựa trên kết quả Audit toàn diện Frontend/UI/UX ngày 2026-09-12 sau khi hoàn thành rollout C26:
- Ứng dụng hiện có nền tảng nghiệp vụ authoritative, phân trang RPC, bảo mật dữ liệu và SSR Privacy rất vững chắc.
- Tuy nhiên, kiến trúc CSS (`apps/web/src/app/globals.css` gần 94KB, gần 1.400 dòng) bị phình to do tích lũy qua các checkpoint, thiếu hệ thống component nguyên tử (UI Primitives) tái sử dụng.
- Giao diện còn thiếu chiều sâu thị giác (elevation, typography hierarchy, micro-interactions), bố cục Dashboard trên màn hình nhỏ còn dài và luồng ghi nhận giao dịch (log payment) còn qua nhiều bước.

Mục tiêu của C27:
1. Xây dựng bộ thư viện UI Primitives (`apps/web/src/components/ui/`) chuẩn hóa: Button, Input/VndInput, Badge, Card, Dialog/BottomSheet, Toast, Tabs.
2. Tái cấu trúc và tinh gọn `globals.css`, đồng bộ Token thiết kế phong cách **Contemporary Fintech Workspace 2.0**.
3. Nâng cấp trải nghiệm trực quan trên Dashboard & Danh sách khoản vay: tăng chiều sâu, giảm tải chiều cao cuộn trên mobile.
4. Tối ưu hóa độ mượt mà và thao tác thuận tiện: Quick Action/FAB ghi giao dịch 1 chạm, Native-feel Bottom Sheet với cử chỉ vuốt, hệ thống Floating Toast phản hồi tức thì.
5. Thiết kế và cập nhật bộ nhận diện App Icon / Brand Icon hiện đại, chuyên nghiệp.

---

## 2. Phạm vi chi tiết (Scope)

### Giai đoạn 1: Xây dựng bộ UI Primitives & Design Tokens
- Tạo thư mục `apps/web/src/components/ui/`:
  - `button.tsx`: Các biến thể primary, secondary, ghost, danger, touch target >= 46px, loading state mượt mà.
  - `input.tsx` & `vnd-input.tsx`: Input chuẩn hóa kèm focus ring, label nổi, hỗ trợ định dạng số tiền VND tự động.
  - `badge.tsx`: Nhãn trạng thái (ACTIVE, OVERDUE, BAD_DEBT, SETTLED) và hướng vay (LENDING, BORROWING) chuẩn semantic color.
  - `card.tsx`: Card phân tầng (flat, interactive, metric, alert) với shadow mềm mại (`--shadow-card`).
  - `dialog.tsx` / `bottom-sheet.tsx`: Cửa sổ pop-up/sheet trượt từ đáy màn hình, hỗ trợ cử chỉ kéo đóng trên mobile.
  - `toast.tsx`: Hệ thống thông báo nổi (floating toast) toàn cục phản hồi thao tác Server Action tức thì.
  - `tabs.tsx`: Segmented control & Tab bar có active indicator mượt mà.

### Giai đoạn 2: Tái cấu trúc Styling & Tinh gọn `globals.css`
- Tách bạch rõ các tầng CSS:
  1. Base & Design Tokens (Color palette, Dark mode variables, Shadows, Radii, Motion curves).
  2. Typography scale & Tabular numbers rules.
  3. Utility/Animation tokens.
- Loại bỏ các class mồ côi (dead CSS), giảm kích thước file và tránh xung đột kế thừa.

### Giai đoạn 3: Nâng cấp Dashboard & Khoản vay
- **Dashboard:**
  - Tối ưu 4 thẻ KPI chính: độ tương phản cao, số dư lớn dễ nhìn, icon nhận diện riêng.
  - Tinh gọn Action Hero Banner và phần Lịch dự kiến.
  - Thu gọn các bảng phân tích chi tiết vào Accordion/Tabs trực quan, tránh cuộn dài trên mobile.
- **Danh sách khoản vay (`/loans`):**
  - Cải tiến thẻ khoản vay: phân tách rõ Dư nợ gốc vs Lãi đến hạn, tối ưu touch-target và nhãn trạng thái.

### Giai đoạn 4: Tối ưu tương tác Mobile & Bộ icon mới
- Bổ sung Floating Action Button (FAB) / Quick Action tại thanh điều hướng mobile để ghi giao dịch nhanh.
- Chuyển menu "Thêm" và Dialogs thành Native-feel Bottom Sheet.
- Cập nhật App Icon & Favicon theo phương án thiết kế được người dùng phê duyệt.

---

## 3. Acceptance Criteria (Tiêu chí nghiệm thu)

1. **Kiến trúc & Codebase:**
   - Các trang nghiệp vụ chính (`/dashboard`, `/loans`, `/counterparties`, `/expenses`, `/settings`) sử dụng thống nhất các component từ `@/components/ui`.
   - `globals.css` được dọn dẹp, không còn class mồ côi hoặc quy tắc ghi đè chồng chéo khó kiểm soát.
2. **UI/UX & Thao tác:**
   - Thao tác ghi giao dịch (thu lãi, trả gốc) có thể kích hoạt nhanh chóng; có thông báo Toast nổi ngay sau khi Server Action hoàn tất.
   - Trải nghiệm trên thiết bị di động (viewport 375px) thoáng đãng, không bị tràn ngang, không giật lag khi mở menu/modal.
   - Thao tác đóng mở Bottom Sheet mượt mà, hỗ trợ chạm vùng ngoài hoặc phím Escape.
   - Dark mode và Light mode hiển thị đồng bộ, chuẩn độ tương phản WCAG AA.
3. **Bảo toàn bất biến & Nghiệp vụ:**
   - Không can thiệp vào logic tính lãi authoritative tại PostgreSQL.
   - Giữ nguyên cơ chế Privacy SSR (che tiền bằng cookie), không gây hydration mismatch hay chớp tiền.
   - Giữ nguyên cảnh báo rời trang khi dữ liệu chưa lưu (`BusinessForm` dirty check).
4. **Test Gate:**
   - `pnpm lint` sạch.
   - `pnpm typecheck` sạch.
   - `pnpm test` đạt toàn bộ 73/73 tests.
   - `pnpm build` thành công.
   - `pnpm test:e2e` đạt đầy đủ các kịch bản.
   - `git diff --check` sạch.

---

## 4. Trạng thái Checkpoint

- **Trạng thái:** `COMPLETED` local ngày 2026-09-12 (được người dùng phê duyệt trực tiếp).
- Phạm vi triển khai local; mọi rollout Preview/Production vẫn cần phê duyệt riêng theo `AGENTS.md`.

## 5. Kết quả và bằng chứng nghiệm thu

- Đã tạo các primitive Button, Input/Select/Textarea, VndInput, Badge, Card, Tabs, Toast và
  BottomSheet; các trang nghiệp vụ chính đã dùng thống nhất qua `@/components/ui`.
- Palette được chuẩn hóa về trust-blue/cobalt; bổ sung token elevation, motion, focus và z-index.
  Light/dark cùng responsive 375/768/1024/1440 đã được kiểm tra bằng ảnh và E2E.
- `globals.css` giảm từ khoảng 99,8 KB xuống 74,6 KB; CSS primitive và playground được tách thành
  `styles/ui-primitives.css` và `styles/playground.css`, đồng thời bỏ các override trùng lặp.
- Quick Action ở thẻ khoản vay mở trực tiếp sheet ghi giao dịch; menu mobile và bộ lọc nâng cao
  dùng BottomSheet. Sheet hỗ trợ nút đóng, Escape, chạm backdrop và vuốt xuống; Toast có live-region,
  nút đóng và tự ẩn sau 4,2 giây.
- Không thay đổi logic nghiệp vụ, API, dữ liệu, migration, routing hay cơ chế Privacy SSR.
- Gate đạt: `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6 và
  E2E 21/21. DB lint/pgTAP không áp dụng vì checkpoint không thay đổi database; E2E/Auth vẫn reset
  và áp đủ 29 migration trên database local.
