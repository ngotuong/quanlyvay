"use client";

import { useState, type CSSProperties } from "react";
import { PrivacyAmount, PrivacyRegion } from "@/components/app/privacy-provider";
import { formatVnd } from "@/lib/business/format";
import type { DashboardCashFlow } from "@/lib/business/types";

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return `T${Number(month)}/${year}`;
}

function ratio(value: string, maximum: bigint) {
  if (maximum === BigInt(0)) return "0%";
  return `${Math.max(2, Number((BigInt(value) * BigInt(100)) / maximum))}%`;
}

export function CashFlowBars({ rows, maximum }: { rows: DashboardCashFlow[]; maximum: string }) {
  const [activeBar, setActiveBar] = useState<string | null>(null);
  const maximumValue = BigInt(maximum);

  return (
    <div
      className="cash-flow-chart"
      style={{ "--month-count": rows.length } as CSSProperties}
      role="group"
      aria-label="Biểu đồ cột so sánh tiền vào và tiền ra theo tháng. Chạm, bấm hoặc dùng bàn phím trên từng cột để xem số tiền chính xác."
      onKeyDown={(event) => {
        if (event.key === "Escape") setActiveBar(null);
      }}
    >
      {rows.map((row) => (
        <div className="cash-flow-month" key={row.month}>
          <div className="bar-pair">
            {([
              ["inflow", "Tiền vào", row.inflowVnd],
              ["outflow", "Tiền ra", row.outflowVnd],
            ] as const).map(([series, label, value]) => {
              const key = `${row.month}-${series}`;
              const tooltipId = `cash-flow-${key}`;
              const active = activeBar === key;
              const barSize = ratio(value, maximumValue);

              return (
                <PrivacyRegion key={key}>
                  <button
                    className="cash-bar-control"
                    type="button"
                    aria-label={`${label} ${monthLabel(row.month)}: ${formatVnd(value)}`}
                    aria-describedby={active ? tooltipId : undefined}
                    aria-pressed={active}
                    data-active={active}
                    style={{ "--bar-size": barSize } as CSSProperties}
                    onClick={() => setActiveBar((current) => current === key ? null : key)}
                  >
                    <span className="cash-bar" data-series={series} />
                    <span id={tooltipId} className="chart-tooltip privacy-amount" role="tooltip" aria-hidden={!active}>
                      <PrivacyAmount value={formatVnd(value)} />
                    </span>
                  </button>
                </PrivacyRegion>
              );
            })}
          </div>
          <span>{monthLabel(row.month)}</span>
        </div>
      ))}
    </div>
  );
}
