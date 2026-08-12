"use client";

import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  ChartNoAxesCombined,
  Copy,
  GripVertical,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Monitor,
  Moon,
  RotateCcw,
  Smartphone,
  Sun,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "qlv-ui-playground-dashboard-v1";

const blockLabels = {
  period: "Bộ lọc thời gian",
  reminder: "Lịch nhắc tháng này",
  metrics: "Chỉ số chính",
  schedule: "Lịch Dự Kiến",
  cashflow: "Xu hướng dòng tiền",
} as const;

type BlockId = keyof typeof blockLabels;
type Device = "mobile" | "desktop";
type Theme = "light" | "dark";

type PlaygroundConfig = {
  device: Device;
  theme: Theme;
  order: BlockId[];
  hidden: BlockId[];
  accent: string;
  gap: number;
  radius: number;
  content: {
    moduleTitle: string;
    transactionCount: string;
    receivableCount: string;
    receivableAmount: string;
    payableCount: string;
    payableAmount: string;
  };
};

const defaultConfig: PlaygroundConfig = {
  device: "desktop",
  theme: "light",
  order: ["period", "reminder", "metrics", "schedule", "cashflow"],
  hidden: [],
  accent: "#4f46e5",
  gap: 16,
  radius: 16,
  content: {
    moduleTitle: "Tổng quan",
    transactionCount: "16",
    receivableCount: "10",
    receivableAmount: "117.900.000 ₫",
    payableCount: "6",
    payableAmount: "24.350.000 ₫",
  },
};

function isBlockId(value: unknown): value is BlockId {
  return typeof value === "string" && value in blockLabels;
}

function restoreConfig(raw: string | null): PlaygroundConfig {
  if (!raw) return defaultConfig;
  try {
    const parsed = JSON.parse(raw) as Partial<PlaygroundConfig>;
    const order = Array.isArray(parsed.order) ? parsed.order.filter(isBlockId) : defaultConfig.order;
    const completeOrder = [...order, ...defaultConfig.order.filter((item) => !order.includes(item))];
    return {
      ...defaultConfig,
      ...parsed,
      order: completeOrder,
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter(isBlockId) : [],
      content: { ...defaultConfig.content, ...parsed.content },
    };
  } catch {
    return defaultConfig;
  }
}

function PeriodBlock() {
  return <section className="playground-period" aria-label="Bộ lọc thời gian mẫu">
    <button type="button" data-active="true">Tháng này</button>
    <button type="button">Tháng trước</button>
    <button type="button">3 tháng</button>
    <span>01/08/2026–31/08/2026</span>
  </section>;
}

function ReminderBlock({ content }: { content: PlaygroundConfig["content"] }) {
  return <section className="playground-reminder playground-card">
    <div className="playground-reminder-copy">
      <span className="playground-kicker"><CalendarClock size={15} /> Lịch nhắc tháng này</span>
      <h3>Có {content.transactionCount} giao dịch trong tháng này</h3>
      <p><span>{content.receivableCount} khoản phải thu:</span><strong>{content.receivableAmount}</strong></p>
      <p><span>{content.payableCount} khoản phải trả:</span><strong>{content.payableAmount}</strong></p>
    </div>
    <button className="playground-secondary-button" type="button">Xem danh sách</button>
  </section>;
}

const metrics = [
  ["Cho vay đang hoạt động", "4.150.000.000 ₫", "+150.000.000 ₫"],
  ["Dư nợ đi vay", "650.000.000 ₫", "Không đổi"],
  ["Lãi ròng thực thu", "82.450.000 ₫", "+12.300.000 ₫"],
  ["Lãi ròng phát sinh", "93.550.000 ₫", "+8.100.000 ₫"],
] as const;

function MetricsBlock() {
  return <section className="playground-metrics" aria-label="Bốn chỉ số chính mẫu">
    {metrics.map(([label, value, change], index) => <article className="playground-card playground-metric" key={label}>
      <span className="playground-metric-icon"><ChartNoAxesCombined size={18} /></span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small data-neutral={index === 1}>{change}</small>
    </article>)}
  </section>;
}

const scheduleRows = [
  { name: "Duy", date: "24/08/2026", value: "3.000.000 ₫", direction: "LENDING" },
  { name: "Phạm Sơn", date: "08/09/2026", value: "6.900.000 ₫", direction: "BORROWING" },
  { name: "Dũng Hùng", date: "18/09/2026", value: "21.000.000 ₫", direction: "LENDING" },
] as const;

function ScheduleBlock() {
  return <section className="playground-card playground-schedule">
    <header><h3>Lịch Dự Kiến</h3><span>{scheduleRows.length}</span></header>
    <div>
      {scheduleRows.map((row) => <article key={row.name}>
        <span className="playground-direction-icon" data-direction={row.direction}>{row.direction === "LENDING" ? <HandCoins size={18} /> : <Landmark size={18} />}</span>
        <span><strong>{row.name}</strong><small>Ngày đóng lãi · {row.date}</small></span>
        <span><strong>{row.value}</strong><small>{row.direction === "LENDING" ? "Cần thu lãi" : "Cần trả lãi"}</small></span>
      </article>)}
    </div>
  </section>;
}

const cashFlow = [42, 58, 48, 76, 66, 88];

function CashFlowBlock() {
  return <section className="playground-card playground-cashflow">
    <header><span><small>01/03/2026–31/08/2026</small><h3>Xu hướng dòng tiền</h3></span><span className="playground-legend"><i />Tiền vào <i />Tiền ra</span></header>
    <div className="playground-chart" aria-label="Biểu đồ dòng tiền minh họa">
      {cashFlow.map((height, index) => <div key={height}><span><i style={{ height: `${height}%` }} /><i style={{ height: `${Math.max(18, height - 24)}%` }} /></span><small>T{index + 3}</small></div>)}
    </div>
  </section>;
}

function BlockContent({ id, config }: { id: BlockId; config: PlaygroundConfig }) {
  if (id === "period") return <PeriodBlock />;
  if (id === "reminder") return <ReminderBlock content={config.content} />;
  if (id === "metrics") return <MetricsBlock />;
  if (id === "schedule") return <ScheduleBlock />;
  return <CashFlowBlock />;
}

export function DashboardPlayground() {
  const [config, setConfig] = useState(defaultConfig);
  const [hydrated, setHydrated] = useState(false);
  const [dragged, setDragged] = useState<BlockId | null>(null);
  const [message, setMessage] = useState("Các thay đổi sẽ tự lưu trên trình duyệt này.");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setConfig(restoreConfig(window.localStorage.getItem(STORAGE_KEY)));
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config, hydrated]);

  const visibleOrder = useMemo(() => config.order.filter((id) => !config.hidden.includes(id)), [config.hidden, config.order]);

  function updateContent(key: keyof PlaygroundConfig["content"], value: string) {
    setConfig((current) => ({ ...current, content: { ...current.content, [key]: value } }));
  }

  function moveBlock(id: BlockId, direction: -1 | 1) {
    setConfig((current) => {
      const from = current.order.indexOf(id);
      const to = from + direction;
      if (to < 0 || to >= current.order.length) return current;
      const order = [...current.order];
      [order[from], order[to]] = [order[to], order[from]];
      return { ...current, order };
    });
  }

  function dropBefore(target: BlockId) {
    if (!dragged || dragged === target) return;
    setConfig((current) => {
      const order = current.order.filter((id) => id !== dragged);
      order.splice(order.indexOf(target), 0, dragged);
      return { ...current, order };
    });
    setDragged(null);
  }

  async function copyConfig() {
    const payload = JSON.stringify(config, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      setMessage("Đã sao chép cấu hình. Anh có thể gửi trực tiếp cho tôi trong task này.");
    } catch {
      const file = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "qlv-dashboard-playground.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("Trình duyệt không cho sao chép; cấu hình đã được tải xuống.");
    }
  }

  function resetConfig() {
    setConfig(defaultConfig);
    setMessage("Đã khôi phục thiết kế mặc định.");
  }

  return <div className="playground-page">
    <header className="playground-page-heading">
      <div><span className="playground-page-icon"><LayoutDashboard size={24} /></span><div><p>Chỉ có trên Local / Preview</p><h1>UI Playground · Tổng quan</h1><span>Dữ liệu bên dưới hoàn toàn là dữ liệu mẫu.</span></div></div>
      <div className="playground-heading-actions"><button type="button" onClick={resetConfig}><RotateCcw size={17} />Khôi phục</button><button type="button" data-primary onClick={copyConfig}><Copy size={17} />Sao chép cấu hình</button></div>
    </header>

    <div className="playground-toolbar" aria-label="Thiết bị và giao diện xem trước">
      <div role="group" aria-label="Thiết bị"><button type="button" data-active={config.device === "mobile"} onClick={() => setConfig((value) => ({ ...value, device: "mobile" }))}><Smartphone size={17} />Mobile</button><button type="button" data-active={config.device === "desktop"} onClick={() => setConfig((value) => ({ ...value, device: "desktop" }))}><Monitor size={17} />Desktop</button></div>
      <div role="group" aria-label="Giao diện"><button type="button" data-active={config.theme === "light"} onClick={() => setConfig((value) => ({ ...value, theme: "light" }))}><Sun size={17} />Sáng</button><button type="button" data-active={config.theme === "dark"} onClick={() => setConfig((value) => ({ ...value, theme: "dark" }))}><Moon size={17} />Tối</button></div>
      <p aria-live="polite">{message}</p>
    </div>

    <div className="playground-workspace">
      <aside className="playground-controls" aria-label="Điều chỉnh giao diện">
        <details open><summary>Nội dung</summary><div className="playground-control-body">
          <label>Tên module<input value={config.content.moduleTitle} onChange={(event) => updateContent("moduleTitle", event.target.value)} /></label>
          <div className="playground-control-grid"><label>Số giao dịch<input inputMode="numeric" value={config.content.transactionCount} onChange={(event) => updateContent("transactionCount", event.target.value)} /></label><label>Số phải thu<input inputMode="numeric" value={config.content.receivableCount} onChange={(event) => updateContent("receivableCount", event.target.value)} /></label></div>
          <label>Tiền phải thu<input value={config.content.receivableAmount} onChange={(event) => updateContent("receivableAmount", event.target.value)} /></label>
          <div className="playground-control-grid"><label>Số phải trả<input inputMode="numeric" value={config.content.payableCount} onChange={(event) => updateContent("payableCount", event.target.value)} /></label><label>Tiền phải trả<input value={config.content.payableAmount} onChange={(event) => updateContent("payableAmount", event.target.value)} /></label></div>
        </div></details>
        <details open><summary>Kiểu hiển thị</summary><div className="playground-control-body">
          <label className="playground-color-control">Màu chủ đạo<span><input type="color" value={config.accent} onChange={(event) => setConfig((value) => ({ ...value, accent: event.target.value }))} /><code>{config.accent}</code></span></label>
          <label>Khoảng cách giữa khối <output>{config.gap}px</output><input type="range" min="8" max="28" step="2" value={config.gap} onChange={(event) => setConfig((value) => ({ ...value, gap: Number(event.target.value) }))} /></label>
          <label>Bo góc card <output>{config.radius}px</output><input type="range" min="8" max="24" step="2" value={config.radius} onChange={(event) => setConfig((value) => ({ ...value, radius: Number(event.target.value) }))} /></label>
        </div></details>
        <details open><summary>Thứ tự và hiển thị</summary><div className="playground-control-body playground-order-list">
          {config.order.map((id, index) => <div key={id}><GripVertical size={18} aria-hidden="true" /><label><input type="checkbox" checked={!config.hidden.includes(id)} onChange={(event) => setConfig((current) => ({ ...current, hidden: event.target.checked ? current.hidden.filter((item) => item !== id) : [...current.hidden, id] }))} />{blockLabels[id]}</label><button type="button" aria-label={`Đưa ${blockLabels[id]} lên`} disabled={index === 0} onClick={() => moveBlock(id, -1)}><ArrowUp size={16} /></button><button type="button" aria-label={`Đưa ${blockLabels[id]} xuống`} disabled={index === config.order.length - 1} onClick={() => moveBlock(id, 1)}><ArrowDown size={16} /></button></div>)}
        </div></details>
      </aside>

      <section className="playground-canvas-shell" data-device={config.device} aria-label="Bản xem trước Tổng quan">
        <div className="playground-canvas-label"><span>{config.device === "mobile" ? "375 px" : "Desktop linh hoạt"}</span><span>Kéo từng khối để đổi thứ tự</span></div>
        <div className="playground-canvas" data-theme={config.theme} style={{ "--playground-accent": config.accent, "--playground-gap": `${config.gap}px`, "--playground-radius": `${config.radius}px` } as React.CSSProperties}>
          <header className="playground-preview-header"><LayoutDashboard size={20} /><h2>{config.content.moduleTitle}</h2></header>
          <main>
            {visibleOrder.map((id) => <div className="playground-draggable" draggable onDragStart={() => setDragged(id)} onDragEnd={() => setDragged(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropBefore(id)} data-dragging={dragged === id} key={id}>
              <span className="playground-drag-handle" aria-hidden="true"><GripVertical size={17} /></span>
              <BlockContent id={id} config={config} />
            </div>)}
          </main>
        </div>
      </section>
    </div>
  </div>;
}
