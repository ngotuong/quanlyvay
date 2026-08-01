export default function Loading() {
  return <main className="route-loading" aria-label="Đang tải"><div className="loading-sidebar" /><div className="loading-content"><div className="skeleton skeleton-title" /><div className="skeleton-grid">{Array.from({ length: 4 }).map((_, index) => <div className="skeleton skeleton-card" key={index} />)}</div></div></main>;
}
