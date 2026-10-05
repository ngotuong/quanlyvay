export default function Loading() {
  return <div className="content-loading" aria-label="Đang tải nội dung" aria-busy="true" role="status">
    <span className="sr-only">Đang tải nội dung mới</span>
    <p className="content-loading-label" aria-hidden="true">Đang mở nội dung…</p>
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-toolbar" />
    <div className="skeleton-grid">{Array.from({ length: 4 }).map((_, index) => <div className="skeleton skeleton-card" key={index} />)}</div>
    <div className="skeleton-content-grid"><div className="skeleton skeleton-panel" /><div className="skeleton skeleton-panel skeleton-panel-wide" /></div>
  </div>;
}
