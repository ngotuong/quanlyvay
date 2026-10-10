# C95 — Inventory VndInput và phạm vi kích hoạt

OWNER duyệt10/10/2026; source trước0aa52ac. Nhóm chốt +50tr/+100tr/+150tr/+200tr cộng dồn,
không autosubmit. C95 chỉ kích hoạt nhóm này cho **Ghi giao dịch → Tiền gốc**, đúng context
Minh An được chọn tại C92. Primitive có cấu hình opt-in; mọi consumer khác không tự có chip.
Inventory source hiện tại: 7 file consumer, 9 khai báo VndInput; paymentAmount dùng chung
cho hai loại tiền. Bảng dưới tách hai loại và gộp hai field legacy để đọc theo nghiệp vụ.

| Consumer | Context/validation | Nhóm50–200triệu |
|---|---|---|
| loan-actions/paymentAmount, PRINCIPAL_PAYMENT | positive VND≤signed bigint, snapshot dư gốc raw do server cấp; RPC revalidates trên ngày/ledger thật | BẬT |
| loan-actions/paymentAmount, INTEREST_PAYMENT | lãi/overpayment theo RPC; giữ suggested amount authoritative hiện hữu | Không bật, không áp mức lớn lên lãi |
| period-interest-payment-form | lãi riêng kỳ, preview/overpayment theo RPC | Không bật |
| loan-actions/expenseAmount | chi phí liên quan khoản vay | Không bật |
| general-expense-form | chi phí chung | Không bật |
| loan-form/originalPrincipalVnd | gốc khoản vay mới | Không bật trong phạm vi đã chốt; không đổi defaults |
| principal-restructure-form/principalPaymentVnd | số gốc thực trả, preview authoritative theo ngày hiệu lực và chốt lãi | Không bật; không dùng snapshot để tính phương án |
| loan-correction-form | sửa dữ liệu gốc có audit | Không bật |
| legacy-onboarding-form/principal+interest | mở đầu dữ liệu cũ, nonnegative/authoritative | Không bật |

Snapshot giới hạn nhập nhanh là tiện ích nhập cho context hiện tại, không là quyết toán.
Nếu ledger/ngày thay đổi, server/RPC hiện hữu vẫn quyết định; không optimistic settle hoặc tự tính lãi.
Form pending/hydration fieldset khóa mọi chip, private/VIEWER boundary giữ. Chọn loại tiền chỉ
đổi nhóm chip, giữ amount/draft hiện hữu. Reset giữ default lifecycle và callback normalized.
