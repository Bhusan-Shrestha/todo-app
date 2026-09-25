const test = require("node:test");
const assert = require("node:assert");
const { calculateStats } = require("../src/calculateStats");

test("empty list gives zeros", () => {
  const r = calculateStats([]);
  assert.deepStrictEqual(r, {
    total: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
    oldestPending: null,
  });
});

test("counts completed and pending and finds oldest pending", () => {
  const r = calculateStats([
    { id: 1, title: "a", completed: true, created_at: "2026-09-01T00:00:00Z" },
    { id: 2, title: "b", completed: false, created_at: "2026-09-03T00:00:00Z" },
    { id: 3, title: "c", completed: false, created_at: "2026-09-02T00:00:00Z" },
  ]);
  assert.strictEqual(r.total, 3);
  assert.strictEqual(r.completed, 1);
  assert.strictEqual(r.pending, 2);
  assert.strictEqual(r.completionRate, 33.3);
  assert.strictEqual(r.oldestPending.id, 3);
});

test("all completed means no oldest pending", () => {
  const r = calculateStats([
    { id: 1, title: "a", completed: true, created_at: "2026-09-01T00:00:00Z" },
  ]);
  assert.strictEqual(r.completionRate, 100);
  assert.strictEqual(r.oldestPending, null);
});
