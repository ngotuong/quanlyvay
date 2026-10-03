# C79 — Rollout privacy/focus C78 và cleanup hai deployment C73

Trạng thái: IN_PROGRESS. OWNER phê duyệt03/10/2026 trong hội thoại.

Source local C77–C78 đã review; fingerprint runtime/test khớp gate C78 (lint/typecheck/unit105/
build/full E2E51PASS7SKIP). C79 CI policy/actionlint, dependency audit và history Gitleaks146
commits đạt. Source SHA/Required CI, candidates và Auth/alias/cleanup còn chờ gate vận hành;
chưa tuyên bố rollout hoặc cleanup hoàn tất.

Phạm vi giữ nguyên roadmap mục37: root Preview pipeline, Production từ root với
`--target=production --skip-domain`, giữ aliases trong lúc smoke; kiểm metadata upload thật,
public/Auth/log trước promote. Không schema/RPC/secret/data/Google/account setting thay đổi.

Rollback trước rollout: Preview dpl_BBavYTasgvQ51wyTQbWunqysM6Fq và Production
 dpl_AurpzZ3pUxe7Xp7dWnxuWa2fjXxw, đều C76 Ready. Không xóa hai rollback này.

Đích cleanup chỉ C73 Preview dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb và Production
 dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx. Phải xác minh project/aliases/không dùng rollback,
chuyển default project alias sang candidate Production sạch đã smoke trước xóa từng ID.
Không bulk deletion/retention hoặc tải nội dung secret/dump cũ.

Credential/financial artifact không đưa vào Git. Browser bằng chứng thật chỉ lưu kết luận
sanitized; ảnh/trace chứa dữ liệu tài chính thật không commit. Metadata source/build output
không chứng minh nội dung mọi bundle hoặc thu hồi mọi bản sao/cache ngoài khả năng kiểm chứng.

## Blocker đóng gói phát hiện trong rollout

Source `fdc309faea457dab6fdff1b5c05ef3b6decf14f0` đã push fast-forward; Required CI
[37095805773](https://github.com/ngotuong/quanlyvay/actions/runs/37095805773) mọi job/gate PASS:
pgTAP527, Auth6, E2E50PASS8SKIP, unit105/lint/typecheck/build/dependency/secret/policy đạt.
CI full tree không chứng minh payload sau exclusions build được.

Production candidate `dpl_FQzWmo7sohL4Bv9XHJWdyw8WpTBQ` /
https://quan-ly-vay-ca-nhan-8j3dmcuvp-ngotuong2105.vercel.app ở ERROR, chưa promote/alias:
TypeScript TS2307 tại test/e2e/helpers.ts vì `.vercelignore` loại scripts nhưng còn test/config
tham chiếu scripts/test-environment.cjs. Chỉ điều chỉnh đóng gói trong C79: loại thêm
`apps/web/test/` và `apps/web/playwright.config.ts`, cập nhật contract/fixture upload guard để
chặn hai đường này. Không đổi tsconfig hoặc giảm gate kiểm mã test local/CI; không đưa scripts
SQL hay secret trở lại payload. Candidate lỗi giữ nguyên, không mở rộng cleanup ngoài hai C73.
Preview gate chain đã interrupt trước remote deploy; teardown DB55322 về0/0/0.

Guard regression3 PASS. Dry metadata sau sửa:150 regular files,4.246.478bytes,
11 entries thư mục rỗng;0 forbidden filenames, không có scripts/test/Playwright config.
Chưa lấy dry-run làm bằng chứng inventory candidate thật; commit/CI mới và retry còn chờ.

Sau sửa đóng gói, local lint/typecheck/unit105/build/diff PASS; không giảm typecheck.
150 SHA1 dry metadata khớp file hiện tại. Full E2E sẽ chạy qua root Preview pipeline sau CI SHA mới.
