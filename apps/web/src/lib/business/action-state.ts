export type BusinessActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  createdId?: string;
  /** Client-only sequence used to distinguish repeated results with identical copy. */
  submissionId?: number;
};

export const initialBusinessActionState: BusinessActionState = { ok: false, message: "" };
