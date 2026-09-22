export type LoanDirection = "LENDING" | "BORROWING";
export type LoanStatus = "ACTIVE" | "OVERDUE" | "BAD_DEBT" | "SETTLED";

export type CalculatedInterestPeriod = {
  kind: "SCHEDULED" | "SETTLEMENT" | "OVERDUE";
  startDate: string;
  endDate: string;
  dayCount: number;
  openingPrincipalVnd: string;
  closingPrincipalVnd: string;
  openingInterestBalanceVnd: string;
  accruedInterestVnd: string;
  interestPaymentsVnd: string;
  closingInterestBalanceVnd: string;
  segments: unknown[];
};

export type CalculationSnapshot = {
  loanId: string;
  asOfDate: string;
  maturityDate: string | null;
  status: LoanStatus;
  principalOutstandingVnd: string;
  interestBalanceVnd: string;
  periods: CalculatedInterestPeriod[];
};

export type Counterparty = {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Loan = {
  id: string;
  counterparty_id: string;
  name: string;
  direction: LoanDirection;
  status: LoanStatus;
  original_principal_vnd: string;
  disbursement_date: string;
  term_days: number | null;
  maturity_date: string | null;
  interest_cycle_days: 15 | 30;
  interest_reminder_offset_days: number;
  initial_daily_rate_percent: string;
  settled_on: string | null;
  notes: string | null;
  created_at: string;
  counterparties: { name: string } | null;
  calculation?: CalculationSnapshot | null;
};

export type LoanTermSummary = {
  cycleDays: 15 | 30;
  periodRatePercent: string;
  fullPeriodInterestVnd: string;
};

export type LoanScheduleSummary = {
  hasMaturity: boolean;
  maturityDate: string | null;
  nextInterestDueDate: string | null;
  nextInterestPeriodEndDate: string | null;
  interestReminderOffsetDays: number;
};

export type PrincipalRestructurePreview = {
  loanId: string;
  effectiveDate: string;
  interestThroughDate: string;
  principalBeforeVnd: string;
  principalPaymentVnd: string;
  principalAfterVnd: string;
  interestBalanceBeforeVnd: string;
  interestToSettleVnd: string;
  newPeriodStartDate: string;
  newPeriodEndDate: string;
  newPeriodDayCount: number;
  newPeriodInterestVnd: string;
  dailyRatePercent: string;
};

export type LegacyLoanOnboarding = {
  id: string;
  as_of_date: string;
  principal_outstanding_vnd: string;
  interest_collected_vnd: string;
  bad_debt_since: string | null;
  note: string | null;
  idempotency_key: string;
  created_at: string;
};

export type LoanTransaction = {
  id: string;
  type: "DISBURSEMENT" | "INTEREST_PAYMENT" | "PRINCIPAL_PAYMENT" | "EXPENSE" | "REVERSAL";
  transaction_date: string;
  amount_vnd: string;
  note: string | null;
  reversal_of_id: string | null;
  idempotency_key: string | null;
  created_at: string;
  expenses: { category: string } | null;
};

export type LifecycleEvent = {
  id: string;
  event_type: "RATE_CHANGE" | "BAD_DEBT_START" | "INTEREST_RESUME" | "SETTLEMENT";
  effective_date: string;
  daily_rate_percent: string | null;
  note: string | null;
  idempotency_key: string | null;
  created_at: string;
};

export type SettlementReversal = {
  id: string;
  settlement_event_id: string;
  reversal_date: string;
  reason: string;
  created_at: string;
};

export type PrincipalRestructure = {
  id: string;
  effective_date: string;
  principal_before_vnd: string;
  principal_payment_vnd: string;
  principal_after_vnd: string;
  interest_settled_vnd: string;
  principal_transaction_id: string;
  interest_transaction_id: string | null;
  note: string | null;
  idempotency_key: string;
  created_at: string;
};

export type InterestPeriod = {
  id: string;
  kind: "SCHEDULED" | "SETTLEMENT" | "OVERDUE";
  start_date: string;
  end_date: string;
  day_count: number;
  opening_principal_vnd: string;
  closing_principal_vnd: string;
  accrued_interest_vnd: string;
  interest_payments_vnd: string;
  closing_interest_balance_vnd: string;
};

export type AuditLog = {
  id: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  profiles: { display_name: string } | null;
};

export type DashboardDueLoan = {
  id: string;
  name: string;
  direction: LoanDirection;
  status: "ACTIVE" | "OVERDUE";
  attentionType: "INTEREST_DUE" | "PRINCIPAL_OVERDUE";
  reminderDate: string | null;
  periodEndDate: string;
  dueDate: string;
  principalVnd: string;
  interestVnd: string;
};

export type DashboardCashFlow = {
  month: string;
  inflowVnd: string;
  outflowVnd: string;
  netVnd: string;
};

export type CounterpartyExposure = {
  counterpartyId: string;
  name: string;
  lendingVnd: string;
  badDebtVnd: string;
  borrowingVnd: string;
  totalVnd: string;
};

export type ManagementAnalytics = {
  lendingAccruedVnd: string;
  borrowingAccruedVnd: string;
  counterpartyExposure: CounterpartyExposure[];
};

export type LoanManagementSummary = {
  asOfDate: string;
  totalAccruedInterestVnd: string;
  interestRecordedVnd: string;
  principalRepaidVnd: string;
};

export type DashboardData = {
  periodStartDate: string;
  periodEndDate: string;
  activeLendingOutstandingVnd: string;
  badDebtLendingOutstandingVnd: string;
  totalLendingExposureVnd: string;
  activeBorrowingOutstandingVnd: string;
  badDebtBorrowingOutstandingVnd: string;
  totalBorrowingExposureVnd: string;
  interestCollectedVnd: string;
  interestPaidVnd: string;
  expensesPaidVnd: string;
  cashProfitVnd: string;
  accrualProfitVnd: string;
  projectedLendingInterestVnd: string;
  projectedBorrowingInterestVnd: string;
  upcoming: DashboardDueLoan[];
  overdue: DashboardDueLoan[];
  cashFlow: DashboardCashFlow[];
};

export type AppNotification = {
  id: string;
  loan_id: string | null;
  type: "INTEREST_DUE" | "LOAN_OVERDUE";
  notification_date: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type GeneralExpense = {
  id: string;
  type: "EXPENSE" | "REVERSAL";
  transaction_date: string;
  amount_vnd: string;
  note: string | null;
  reversal_of_id: string | null;
  created_at: string;
  expenses: { category: string } | null;
};
