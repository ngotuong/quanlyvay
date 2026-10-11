# C98 — Đề xuất thời hạn job CI

Trạng thái: APPROVED và đã áp dụng ngày11/10/2026. OWNER trả lời “Phê duyệt deadline job 45 phút” trong hội thoại hiện tại. Chỉ một dòng deadline job integration35→45m đã đổi; đang kiểm tra và chờ CI mới đúngSHA đủ5job SUCCESS.

Commit cuối `7e130d9c0a81d342117316a3aed6497c5453250d`, [Required CI 38146959473](https://github.com/ngotuong/quanlyvay/actions/runs/38146959473), bị hủy ở cả hai lần do giới hạn job 35 phút. Lần 1 tới bài 100/102; lần 2 tới bài 102/102 rồi bắt đầu global teardown lúc 15:35:19 UTC và bị hủy khi database đang restart lúc 15:35:56 UTC. Không có summary E2E hoàn chỉnh, nên không tính hai lượt là PASS. GitHub xác nhận `The job has exceeded the maximum execution time of 35m0s`. Ba job policy/quality/security đạt; integration bị hủy và Required CI gate thất bại.

Đề xuất sửa đúng một dòng trong `.github/workflows/ci.yml`, job `integration`: `timeout-minutes: 35` → `timeout-minutes: 45`. Xem [patch](ci-budget-proposal.patch). Đây là thời hạn toàn job gồm dựng Supabase, DB lint/pgTAP, Auth, cài browser, E2E và cleanup. Giữ timeout từng bài/assertion, retries=0, đủ 102 bài và skips hiện hữu, reset/teardown, 5 job và gate fail-closed. Không sửa sản phẩm hoặc phát hành lại.

Sau phê duyệt: patch đã áp dụng; kiểm policy/actionlint/unit và diff; ghi amendment C98; commit/push; đợi Required CI đủ 5 job SUCCESS đúng SHA. Chỉ chốt C98 sau khi CI trạng thái cuối đạt. Không tự tạo C99.

AGENTS§3 yêu cầu ghi đề xuất khi phạm vi phát sinh: “Nếu phạm vi phát sinh ngoài checkpoint, ghi nhận đề xuất; không âm thầm triển khai.” Việc coi thay đổi thời hạn job đã dùng trong nghiệm thu là điều chỉnh cần duyệt là cách áp dụng quy tắc này; AGENTS không chỉ định con số 35 hoặc 45 phút.

Bằng chứng metadata: [final-ci-blocker.json](final-ci-blocker.json); raw logs ở cache ignored. Release/source/closing proof trước đó vẫn đạt; C98 hiện IN_PROGRESS, chờ CI mới sau amendment đã duyệt.

Kiểm tra đề xuất: policy và actionlint của bản workflow dự kiến PASS; regression policy 2/2 PASS; patch dry-run, JSON parse và git diff --check PASS. Workflow hiện chỉ đổi deadline job integration35→45m theo phê duyệt.

Sau áp dụng: pnpm ci:validate PASS (policy/actionlint), pnpm test 121/121 PASS; diff kiểm một dòng workflow35→45m, không đổi app/test/schema. CI mới vẫn là gate bắt buộc trước chốt.
