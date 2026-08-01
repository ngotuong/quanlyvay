export const LOAN_DIRECTIONS = ["LENDING", "BORROWING"] as const;
export type LoanDirection = (typeof LOAN_DIRECTIONS)[number];

export const LOAN_STATUSES = [
  "ACTIVE",
  "OVERDUE",
  "BAD_DEBT",
  "SETTLED",
] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const USER_ROLES = ["OWNER", "EDITOR", "VIEWER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const TRANSACTION_TYPES = [
  "DISBURSEMENT",
  "INTEREST_PAYMENT",
  "PRINCIPAL_PAYMENT",
  "EXPENSE",
  "REVERSAL",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const LIFECYCLE_EVENT_TYPES = [
  "RATE_CHANGE",
  "BAD_DEBT_START",
  "INTEREST_RESUME",
  "SETTLEMENT",
] as const;
export type LifecycleEventType = (typeof LIFECYCLE_EVENT_TYPES)[number];

export const INTEREST_PERIOD_KINDS = [
  "SCHEDULED",
  "SETTLEMENT",
  "OVERDUE",
] as const;
export type InterestPeriodKind = (typeof INTEREST_PERIOD_KINDS)[number];

/** YYYY-MM-DD in Asia/Ho_Chi_Minh. Validated at the application boundary. */
export type LocalDate = string;

/** Integer VND encoded as a base-10 string at API/fixture boundaries. */
export type VndAmount = string;

/** Signed integer VND; only balances such as prepaid interest may be negative. */
export type SignedVndAmount = string;

/** Percent per calendar day encoded as a non-negative decimal string. */
export type DailyRatePercent = string;

export interface LoanTerms {
  direction: LoanDirection;
  originalPrincipalVnd: VndAmount;
  disbursementDate: LocalDate;
  termDays: number;
  interestCycleDays: 15 | 30;
  initialDailyRatePercent: DailyRatePercent;
}

interface DomainEventBase {
  id: string;
  date: LocalDate;
}

export interface InterestPaymentEvent extends DomainEventBase {
  type: "INTEREST_PAYMENT";
  amountVnd: VndAmount;
  note?: string;
}

export interface PrincipalPaymentEvent extends DomainEventBase {
  type: "PRINCIPAL_PAYMENT";
  amountVnd: VndAmount;
  note?: string;
}

export interface RateChangeEvent extends DomainEventBase {
  type: "RATE_CHANGE";
  dailyRatePercent: DailyRatePercent;
}

export interface BadDebtStartEvent extends DomainEventBase {
  type: "BAD_DEBT_START";
}

export interface InterestResumeEvent extends DomainEventBase {
  type: "INTEREST_RESUME";
  dailyRatePercent: DailyRatePercent;
}

export interface SettlementEvent extends DomainEventBase {
  type: "SETTLEMENT";
  principalAmountVnd: VndAmount;
  interestAmountVnd: VndAmount;
}

export interface ReversalEvent extends DomainEventBase {
  type: "REVERSAL";
  reversesTransactionId: string;
  note: string;
}

export type FixtureDomainEvent =
  | InterestPaymentEvent
  | PrincipalPaymentEvent
  | RateChangeEvent
  | BadDebtStartEvent
  | InterestResumeEvent
  | SettlementEvent
  | ReversalEvent;

export interface InterestSegmentExpectation {
  startDate: LocalDate;
  endDate: LocalDate;
  dayCount: number;
  principalVnd: VndAmount;
  dailyRatePercent: DailyRatePercent;
}

export interface InterestPeriodExpectation {
  kind: InterestPeriodKind;
  startDate: LocalDate;
  endDate: LocalDate;
  dayCount: number;
  segments: InterestSegmentExpectation[];
  openingInterestBalanceVnd: SignedVndAmount;
  accruedInterestVnd: VndAmount;
  interestPaymentsVnd: VndAmount;
  closingInterestBalanceVnd: SignedVndAmount;
}

export interface InterestFixtureCase {
  id: string;
  description: string;
  input: LoanTerms & {
    asOfDate: LocalDate;
    events: FixtureDomainEvent[];
  };
  expected: {
    maturityDate: LocalDate;
    status: LoanStatus;
    principalOutstandingVnd: VndAmount;
    interestBalanceVnd: SignedVndAmount;
    periods: InterestPeriodExpectation[];
  };
}

export interface InterestFixtureSuite {
  schemaVersion: 1;
  currency: "VND";
  timezone: "Asia/Ho_Chi_Minh";
  rounding: "HALF_UP_AT_PERIOD_END";
  cases: InterestFixtureCase[];
}
