'use client';

export default function StatsPanel({ stats }) {
  if (!stats) return null;

  const rate = stats.completionRate ?? 0;

  return (
    <aside className="stats-panel">
      <div className="stats-panel-heading">
        <h2 className="stats-panel-title">Progress</h2>
        <span className="stats-panel-caption">Your tasks</span>
      </div>

      <div className="stats-row">
        <span className="stats-label">Total</span>
        <span className="stats-value">{stats.total}</span>
      </div>
      <div className="stats-row">
        <span className="stats-label">Completed</span>
        <span className="stats-value" style={{ color: 'var(--accent-emerald)' }}>{stats.completed}</span>
      </div>
      <div className="stats-row">
        <span className="stats-label">Pending</span>
        <span className="stats-value" style={{ color: 'var(--brand-mid)' }}>{stats.pending}</span>
      </div>

      <div className="stats-rate-bar">
        <div
          className="stats-rate-fill"
          style={{ width: `${rate}%` }}
          role="progressbar"
          aria-valuenow={rate}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="stats-rate-label">{rate}% complete</p>

      {stats.highPriority > 0 && (
        <div className="stats-row" style={{ marginTop: 8 }}>
          <span className="stats-label">⚠ High priority</span>
          <span className="stats-value" style={{ color: '#fb7185' }}>{stats.highPriority}</span>
        </div>
      )}

      {stats.oldestPending && (
        <div className="stats-oldest">
          <span className="stats-label">Oldest pending</span>
          <p className="stats-oldest-title">{stats.oldestPending.title}</p>
        </div>
      )}
    </aside>
  );
}
