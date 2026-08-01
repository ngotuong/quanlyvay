export type LoanDirection = "LENDING" | "BORROWING";
export type LoanStatus = "ACTIVE" | "OVERDUE" | "BAD_DEBT" | "SETTLED";

export type CalculationSnapshot = {
  loanId: string;
  asOfDate: string;
  maturityDate: string;
  status: LoanStatus;
  principalOutstandingVnd: string;
  interestBalanceVnd: string;
  periods: unknown[];
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
  original_principal_vnd: number;
  disbursement_date: string;
  term_days: number;
  maturity_date: string;
  interest_cycle_days: 15 | 30;
  initial_daily_rate_percent: number;
  settled_on: string | null;
  notes: string | null;
  created_at: string;
  counterparties: { name: string } | null;
  calculation?: CalculationSnapshot | null;
};

export type LoanTransaction = {
  id: string;
  type: "DISBURSEMENT" | "INTEREST_PAYMENT" | "PRINCIPAL_PAYMENT" | "EXPENSE" | "REVERSAL";
  transaction_date: string;
  amount_vnd: number;
  note: string | null;
  reversal_of_id: string | null;
  created_at: string;
  expenses: { category: string }[] | null;
};

export type LifecycleEvent = {
  id: string;
  event_type: "RATE_CHANGE" | "BAD_DEBT_START" | "INTEREST_RESUME" | "SETTLEMENT";
  effective_date: string;
  daily_rate_percent: number | null;
  note: string | null;
  created_at: string;
};

export type InterestPeriod = {
  id: string;
  kind: "SCHEDULED" | "SETTLEMENT" | "OVERDUE";
  start_date: string;
  end_date: string;
  day_count: number;
  opening_principal_vnd: number;
  closing_principal_vnd: number;
  accrued_interest_vnd: number;
  interest_payments_vnd: number;
  closing_interest_balance_vnd: number;
};

export type AuditLog = {
  id: number;
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

export type DashboardData = {
  asOfDate: string;
  lendingOutstandingVnd: string;
  borrowingOutstandingVnd: string;
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
