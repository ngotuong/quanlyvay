# C97 — Implementation

- `components/app/route-loading.tsx` dùng khuôn header/classes/token đang có; mỗi route có
  `loading.tsx` server riêng (Dashboard, loans/detail/new, counterparties, expenses, notifications,
  audit, settings). Root fallback trung tính. UI Skeleton dùng chung, aria-hidden, không control
  giả/amount/identity tài chính; status aria-busy bằng tiếng Việt. Ba placeholder dòng không phải
  count dữ liệu. KPI/task/chart skeleton theo thứ tự A; table/list/timeline/form khác nhau.
  Loading dùng loading-metrics/loading-focus-grid, không trùng selector nội dung đã tải trong
  streamed DOM. Loans giữ khung405pxmobile/161pxdesktop, filter176/184px; Settings/contact/task
  có vùng riêng. Geometry gần cấu trúc, không bắt chước số dòng/permission/data chưa đọc.
- `styles/loading-motion.css`: shimmer1.8s và geometry responsive; Dashboard drawer dành sẵn
  body, mobileheight min860px/viewport−24, scroll bên trong/headerfooter. Số dư seedfresh giữ
  authoritative; skeleton chỉ vào vùng đã ẩn snapshot lúc reread. Hủy focus trong preload
  được đưa về Hủy của form mới nếu node cũ bị gỡ; preventScroll, không lấy focus control khác.
- `BottomSheet`: active pointer primary/button0/onepointer; translate bounded180px với
  distance/(1+distance/360), rawdismiss threshold88px như cũ. Directdrag transitionnone,
  snapback320ms curve hiện có; backdrop opacity có giới hạn, bỏ blur. Pointercancel/captureloss
  reset/snapback, không dismiss; pending reset/khóa; dirtyclose gọi handler đúng1lần. Nút/Escape
  và native dialog/focus trap giữ. Không spring overshoot/haptic thật/60fps promise.
- Dashboard enter bên phải desktop/đáy mobile220ms, exit150ms. `sheet-exit.ts` giữ native modal
  tới animationend, có fallback computed-duration+50ms và cleanup; reducedmotion complete ngay.
  Provider giữ registry/guards/history/focus recovery C96; trong exit chặn thêm click/traversal.
  Các controller cũ có close timer180ms giữ: exit150ms xong rồi30ms hold, không tăng wait.
- Native details::details-content progressive opacity150ms; giữ details/summary/Enter/Space và
  closed hidden/AX/tab semantics. Không thay bằng custom accordion. Button press bỏ scale
  toànapp, paint opacity chỉ Quick Amount/dialog actions. Giữ native input/date/focus theo C92.
- Reduced-motion explicitly animationnone cho skeleton/drawer/backdrop và transitionnone
  cho snapback/details; startup/SPA còn status và feedback tĩnh qua rules đã có.

Không đổi Auth/session/RLS contract, schema/RPC/queries/actions/financial validation, dependency,
Google/backup hoặc dữ liệu dùng chung. Logic navigationfeedback gốc đã có slow8s/realcommit/cancel,
C63 fullgate sẽ xác nhận10s/cachedBackForward/dirtycancel; không thêm timeout ngừng giả lúc dữ liệu
còn tải. C96 timeout12s/readretry/idempotency/mutation lifecycle vẫn nguyên.
