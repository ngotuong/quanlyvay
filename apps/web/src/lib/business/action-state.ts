export type BusinessActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialBusinessActionState: BusinessActionState = { ok: false, message: "" };
