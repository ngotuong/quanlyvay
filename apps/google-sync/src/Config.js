/** @typedef {{name:string, table:string, headers:string[], fields:string[], types:string[]}} SyncSheetDefinition */

/** @type {SyncSheetDefinition[]} */
const SYNC_SHEETS = [
  { name: "Đối tác", table: "counterparties", headers: ["ID", "Tên", "Ghi chú", "Ngày tạo", "Cập nhật"], fields: ["id", "name", "notes", "created_at", "updated_at"], types: ["text", "text", "text", "datetime", "datetime"] },
  { name: "Khoản vay", table: "loans", headers: ["ID", "Đối tác ID", "Tên khoản", "Hướng", "Trạng thái", "Gốc ban đầu (VND)", "Ngày giải ngân", "Số ngày", "Ngày đáo hạn", "Chu kỳ lãi", "Lãi %/ngày", "Ngày tất toán", "Ghi chú", "Ngày tạo", "Cập nhật"], fields: ["id", "counterparty_id", "name", "direction", "status", "original_principal_vnd", "disbursement_date", "term_days", "maturity_date", "interest_cycle_days", "initial_daily_rate_percent", "settled_on", "notes", "created_at", "updated_at"], types: ["text", "text", "text", "text", "text", "money", "date", "integer", "date", "integer", "rate", "date", "text", "datetime", "datetime"] },
  { name: "Giao dịch", table: "transactions", headers: ["ID", "Khoản vay ID", "Loại", "Ngày giao dịch", "Số tiền (VND)", "Ghi chú", "Đảo giao dịch ID", "Khóa idempotency", "Ngày tạo"], fields: ["id", "loan_id", "type", "transaction_date", "amount_vnd", "note", "reversal_of_id", "idempotency_key", "created_at"], types: ["text", "text", "text", "date", "money", "text", "text", "text", "datetime"] },
  { name: "Sự kiện", table: "lifecycleEvents", headers: ["ID", "Khoản vay ID", "Loại sự kiện", "Ngày hiệu lực", "Lãi %/ngày", "Ghi chú", "Ngày tạo"], fields: ["id", "loan_id", "event_type", "effective_date", "daily_rate_percent", "note", "created_at"], types: ["text", "text", "text", "date", "rate", "text", "datetime"] },
  { name: "Kỳ lãi", table: "interestPeriods", headers: ["ID", "Khoản vay ID", "Loại kỳ", "Từ ngày", "Đến ngày", "Số ngày", "Gốc đầu kỳ", "Gốc cuối kỳ", "Lãi phát sinh", "Lãi đã trả", "Dư lãi cuối kỳ", "Lúc tính"], fields: ["id", "loan_id", "kind", "start_date", "end_date", "day_count", "opening_principal_vnd", "closing_principal_vnd", "accrued_interest_vnd", "interest_payments_vnd", "closing_interest_balance_vnd", "calculated_at"], types: ["text", "text", "text", "date", "date", "integer", "money", "money", "money", "money", "money", "datetime"] },
  { name: "Chi phí", table: "expenses", headers: ["Giao dịch ID", "Danh mục"], fields: ["transaction_id", "category"], types: ["text", "text"] },
  { name: "Thông báo", table: "notifications", headers: ["ID", "User ID", "Khoản vay ID", "Loại", "Ngày nhắc", "Tiêu đề", "Nội dung", "Đã đọc lúc", "Ngày tạo"], fields: ["id", "user_id", "loan_id", "type", "notification_date", "title", "body", "read_at", "created_at"], types: ["text", "text", "text", "text", "date", "text", "text", "datetime", "datetime"] },
  { name: "Lịch sử", table: "auditLogs", headers: ["STT", "User ID", "Bảng", "Bản ghi ID", "Thao tác", "Thời điểm", "Request ID"], fields: ["id", "actor_user_id", "table_name", "record_id", "action", "changed_at", "request_id"], types: ["integer", "text", "text", "text", "text", "datetime", "text"] },
];

const SYNC_TIME_ZONE = "Asia/Ho_Chi_Minh";
const SNAPSHOT_PREFIX = "QLV_Snapshot_";
const SNAPSHOT_RETENTION = 12;
const BACKUP_FOLDER_NAME = "QuanLyVayCaNhan_Backups";
const MANAGED_TRIGGER_HANDLERS = ["runGoogleSheetSync", "runWeeklySnapshot"];
