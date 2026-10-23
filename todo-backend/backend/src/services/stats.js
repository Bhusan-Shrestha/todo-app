function calculateStats(todos) {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed === true).length;
  const pending = total - completed;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 1000) / 10;

  const oldestPending = todos
    .filter((todo) => todo.completed !== true)
    .map((todo) => ({ ...todo, time: new Date(todo.created_at).getTime() }))
    .filter((todo) => !Number.isNaN(todo.time))
    .sort((a, b) => a.time - b.time)[0];

  return {
    total,
    completed,
    pending,
    completionRate,
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
