// Pure function: takes a list of todos, returns numbers about them.
// No database, no network -- that is why this service is easy to scale.
function calculateStats(todos) {
  const total = todos.length;
  const completed = todos.filter((t) => t && t.completed === true).length;
  const pending = total - completed;
  const completionRate =
    total === 0 ? 0 : Math.round((completed / total) * 1000) / 10;

  // Oldest todo that is still not completed
  let oldestPending = null;
  for (const t of todos) {
    if (!t || t.completed === true) continue;
    const time = new Date(t.created_at).getTime();
    if (Number.isNaN(time)) continue;
    if (oldestPending === null || time < oldestPending.time) {
      oldestPending = { time, id: t.id, title: t.title, created_at: t.created_at };
    }
  }

  return {
    total,
    completed,
    pending,
    completionRate, // percent, one decimal (e.g. 33.3)
    oldestPending: oldestPending
      ? {
          id: oldestPending.id,
          title: oldestPending.title,
          created_at: oldestPending.created_at,
        }
      : null,
  };
}

module.exports = { calculateStats };
