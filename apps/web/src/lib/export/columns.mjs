export const GOOGLE_SYNC_SELECTS = Object.freeze({
  counterparties: "id,name,notes,created_at,updated_at",
  loans: "id,counterparty_id,name,direction,status,original_principal_vnd::text,disbursement_date,term_days,maturity_date,interest_cycle_days,initial_daily_rate_percent::text,settled_on,notes,created_at,updated_at",
  transactions: "id,loan_id,type,transaction_date,amount_vnd::text,note,reversal_of_id,idempotency_key,created_at",
  lifecycleEvents: "id,loan_id,event_type,effective_date,daily_rate_percent::text,note,created_at",
  interestPeriods: "id,loan_id,kind,start_date,end_date,day_count,opening_principal_vnd::text,closing_principal_vnd::text,accrued_interest_vnd::text,interest_payments_vnd::text,closing_interest_balance_vnd::text,calculated_at",
  expenses: "transaction_id,category",
  notifications: "id,user_id,loan_id,type,notification_date,title,body,read_at,created_at",
  auditLogs: "id::text,actor_user_id,table_name,record_id,action,changed_at,request_id",
});
