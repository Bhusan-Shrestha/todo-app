'use client';

export default function StatsPanel({ stats }) {
  if (!stats) return null;

  return (
    <aside className="stats-panel">
      <div className="stats-panel-heading">
        <h2 className="stats-panel-title">Your progress</h2>
        <span className="stats-panel-caption">All tasks</span>
      </div>

      <div className="stats-row">
        <span className="stats-label">Total</span>
        <span className="stats-value">{stats.total}</span>
      </div>
      <div className="stats-row">
        <span className="stats-label">Done</span>
        <span className="stats-value">{stats.completed}</span>
      </div>
      <div className="stats-row">
        <span className="stats-label">Pending</span>
        <span className="stats-value">{stats.pending}</span>
      </div>

      <div className="stats-rate-bar">
        <div
          className="stats-rate-fill"
          style={{ width: `${stats.completionRate}%` }}
        />
      </div>
      <p className="stats-rate-label">{stats.completionRate}% complete</p>

      {stats.oldestPending && (
        <div className="stats-oldest">
          <span className="stats-label">Oldest pending</span>
          <p className="stats-oldest-title">{stats.oldestPending.title}</p>
        </div>
      )}
    </aside>
  );
}
