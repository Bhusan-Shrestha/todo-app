'use client';

import { useEffect, useState } from 'react';
import { getStats } from '../lib/api';

const REFRESH_MS = 15000; // refetch every 15s, since todos change from user actions

export default function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getStats();
        if (!cancelled) {
          setStats(data);
          setError(false);
        }
      } catch (err) {
        // Stats are a "nice to have" -- if the microservice is down, hide
        // the panel quietly instead of showing an error over the app.
        if (!cancelled) setError(true);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (error || !stats) return null;

  return (
    <aside className="stats-panel">
      <h2 className="stats-panel-title">Stats</h2>

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
