# Budget C96

Đo bằng Resource Timing trên production build local/Chromium, viewport375 và1280×900,
Light/Dark; browser cache warm giữa samples. Decoded/encoded body bytes là số liệu resource JS,
không phải kích thước HTML/RSC, heap hoặc latency Production. GET khi mở/date/retry đếm riêng.

Baseline82151b6: initialDashboard512865 decoded JS bytes, sau mở detail570270; delta57405.
Budget chọn cho C96: initialDashboard tăng tối đa25KiB so baseline (538465bytes), JS sau mở
thêm tối đa baseline delta+25KiB (83005bytes). Ghi actual, không hứa tăng hiệu năng theo thời gian.

Không GET payment-context trước chọn task hoặc render form cho từng task; một phiên có tối đa
một form. Open nominal1browserGET; đổi ngày/retry mỗi lần1GET mới và cancel/ignore request cũ.
Backend context nominal2businessreads (identity SELECT + calculate_loan); read-only gatewayretry
cho calculate_loan tối đa1lần, không retry financial mutation. Overview detail trước có4businessreads
(loan/calculate/schedule/managementsummary); Auth/profile/layout reads không nằm trong hai số này.

Elapsed quan sát action→formusable chỉ MEASURED_ONLY trong local; không cam kết nhanhgấp3.
Kết quả source cuối ở performance.json/report.md. Noop stale/abort/cancel không được mutate;
mutation dùng hook busy/idempotency, retry vẫn giữkey và ledger chỉ1transaction cho cùngpayload.
