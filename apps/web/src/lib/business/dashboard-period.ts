import { todayInVietnam } from "./format";

export type DashboardPeriod = {
  start: string;
  end: string;
  preset: "six_months" | "this_month" | "previous_month" | "year_to_date" | "custom";
};

const businessDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function monthStart(value: string) {
  return `${value.slice(0, 7)}-01`;
}

function shiftMonth(value: string, offset: number) {
  const [year, month] = value.slice(0, 7).split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));
  return shifted.toISOString().slice(0, 10);
}

function dayBefore(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function isValidBusinessDate(value: string | undefined) {
  if (!value || !businessDatePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function dashboardPresetPeriods(today = todayInVietnam()) {
  const currentMonthStart = monthStart(today);
  const previousMonthStart = shiftMonth(currentMonthStart, -1);
  return {
    six_months: { start: shiftMonth(currentMonthStart, -5), end: today },
    this_month: { start: currentMonthStart, end: today },
    previous_month: { start: previousMonthStart, end: dayBefore(shiftMonth(previousMonthStart, 1)) },
    year_to_date: { start: `${today.slice(0, 4)}-01-01`, end: today },
  } as const;
}

export function resolveDashboardPeriod(params: { from?: string; to?: string; preset?: string }): DashboardPeriod {
  const presets = dashboardPresetPeriods();
  if (params.preset && params.preset in presets) {
    const preset = params.preset as keyof typeof presets;
    return { ...presets[preset], preset };
  }
  if (isValidBusinessDate(params.from) && isValidBusinessDate(params.to) && params.from! <= params.to!) {
    const length = (Date.parse(`${params.to}T00:00:00Z`) - Date.parse(`${params.from}T00:00:00Z`)) / 86_400_000;
    if (length <= 1826) return { start: params.from!, end: params.to!, preset: "custom" };
  }
  return { ...presets.this_month, preset: "this_month" };
}

export function previousDashboardPeriod(period: Pick<DashboardPeriod, "start" | "end">) {
  const start = new Date(`${period.start}T00:00:00Z`);
  const end = new Date(`${period.end}T00:00:00Z`);
  const inclusiveDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const previousEnd = new Date(start);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(start);
  previousStart.setUTCDate(previousStart.getUTCDate() - inclusiveDays);
  return {
    start: previousStart.toISOString().slice(0, 10),
    end: previousEnd.toISOString().slice(0, 10),
  };
}
