import type { LoanDirection, LoanStatus } from "./types";

export type PaymentContext = {
  loanId: string;
  name: string;
  counterpartyName: string;
  direction: LoanDirection;
  status: LoanStatus;
  asOfDate: string;
  principalOutstandingVnd: string;
  interestBalanceVnd: string;
};
