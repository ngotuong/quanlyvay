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
