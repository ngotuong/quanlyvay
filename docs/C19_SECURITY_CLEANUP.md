# C19 — Dọn secret lịch sử và xoay vòng Web Push

## Phạm vi

C19 loại bỏ vật liệu Web Push đã tồn tại trước khi C18 áp dụng sanitize, không thay đổi chính sách
mật khẩu 6 ký tự và không sửa lịch sử tài chính.

1. Chụp backup mã hóa tạm thời trước migration để có điểm phục hồi sự cố.
2. Migration scrub `endpoint`, `p256dh`, `auth_secret` khỏi raw audit, giữ lại fingerprint SHA-256.
3. Bắt buộc sanitize mọi insert trực tiếp vào `audit_logs` để ngăn tái diễn.
4. Xóa subscription cũ; `push_deliveries` vận hành liên quan bị cascade theo schema. Thiết bị phải
   bấm **Bật thông báo** lại sau rollout.
5. Sinh cặp VAPID mới, lưu trong Keychain và cập nhật Preview/Production Vercel.
6. Deploy, chạy smoke, đồng bộ lại Google Sheet và tạo snapshot sạch.
7. Tạo backup mã hóa sau migration, restore rehearsal và so khớp số dòng/invariant nghiệp vụ.
8. Chỉ sau khi bản sạch đạt mọi gate mới chuyển backup/snapshot chứa secret cũ vào Thùng rác.

## Bất biến và bằng chứng bắt buộc

- `loans`, `transactions`, lifecycle/correction/reversal và interest periods giữ nguyên số dòng.
- Không còn key `endpoint`, `p256dh`, `auth_secret` trong raw audit của `push_subscriptions`.
- Không còn subscription hoặc delivery gắn với VAPID cũ.
- Audit delete subscription vẫn tồn tại nhưng chỉ chứa fingerprint.
- Preview và Production dùng cùng cặp VAPID mới; secret không xuất hiện trong Git hoặc log.
- Backup sạch qua checksum, GCM tag và restore rehearsal trên database cô lập.
- Google Sheet/snapshot sau full sync chỉ nhận projection audit đã sanitize.

## Rollback

Migration không được đảo bằng cách phục hồi secret Push cũ. Nếu rollout web thất bại, rollback alias
về deployment đã kiểm chứng trong khi vẫn giữ subscription trống; sau đó sửa và deploy lại với cặp
VAPID mới. Chỉ dùng backup tạm để phục hồi database khi migration thất bại làm sai dữ liệu nghiệp vụ,
không dùng để đưa endpoint/key Push cũ trở lại vận hành bình thường.
