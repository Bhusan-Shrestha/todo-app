const pool = require('../db');

function validDueDate(value) {
  return value === undefined || value === null || value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function todoFilters({ completed, search, priority }, userId) {
  const params = [userId];
  let sql = ' WHERE user_id = $1';
  if (completed === 'true' || completed === 'false') {
    params.push(completed === 'true');
    sql += ` AND completed = $${params.length}`;
  }
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    sql += ` AND (title ILIKE $${params.length} OR COALESCE(description, '') ILIKE $${params.length})`;
  }
  if (['low', 'medium', 'high'].includes(priority)) {
    params.push(priority);
    sql += ` AND priority = $${params.length}`;
  }
  return { sql, params };
}

// GET /api/todos?completed=true|false
async function getTodos(req, res, next) {
  try {
    const { completed, search, priority, sort = 'created' } = req.query;
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const { sql: filters, params } = todoFilters(req.query, req.userId);
    const orderBy = sort === 'due' ? 'due_date ASC NULLS LAST, created_at DESC'
      : sort === 'priority' ? "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC"
      : 'created_at DESC';
    const itemParams = [...params, limit, offset];
    const itemQuery = `SELECT * FROM todos${filters} ORDER BY ${orderBy} LIMIT $${itemParams.length - 1} OFFSET $${itemParams.length}`;
    const countQuery = `SELECT COUNT(*) FROM todos${filters}`;
    const [{ rows }, countResult] = await Promise.all([
      pool.query(itemQuery, itemParams),
      pool.query(countQuery, params),
    ]);
    const count = Number(countResult.rows[0].count);
    res.json({
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.max(Math.ceil(count / limit), 1),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/todos/:id
async function getTodoById(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Todo not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/todos
async function createTodo(req, res, next) {
  try {
    const { title, description, priority, dueDate } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!validDueDate(dueDate)) {
      return res.status(400).json({ error: 'dueDate must use YYYY-MM-DD format' });
    }
    const { rows } = await pool.query(
      'INSERT INTO todos (user_id, title, description, priority, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, title.trim(), description || null, ['low', 'medium', 'high'].includes(priority) ? priority : 'medium', dueDate || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/todos/:id  (update title/description/completed)
async function updateTodo(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, completed, priority, dueDate } = req.body;
    if (!validDueDate(dueDate)) {
      return res.status(400).json({ error: 'dueDate must use YYYY-MM-DD format' });
    }

    const { rows: existingRows } = await pool.query('SELECT * FROM todos WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Todo not found' });
    const existing = existingRows[0];

    const { rows } = await pool.query(
      `UPDATE todos
       SET title = $1, description = $2, completed = $3, priority = $4, due_date = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        title !== undefined ? title : existing.title,
        description !== undefined ? description : existing.description,
        completed !== undefined ? completed : existing.completed,
        ['low', 'medium', 'high'].includes(priority) ? priority : existing.priority,
        dueDate !== undefined ? (dueDate || null) : existing.due_date,
        id,
        req.userId,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/todos/:id/toggle
async function toggleTodo(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'UPDATE todos SET completed = NOT completed WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Todo not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/todos/:id
async function deleteTodo(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Todo not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function clearCompleted(req, res, next) {
  try {
    const result = await pool.query('DELETE FROM todos WHERE user_id = $1 AND completed = TRUE', [req.userId]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    next(err);
  }
}

// GET /api/todos/stats
async function getTodoStats(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE completed = TRUE)::int AS completed,
         (SELECT json_build_object('id', id, 'title', title, 'created_at', created_at)
          FROM todos
          WHERE user_id = $1 AND completed = FALSE
          ORDER BY created_at ASC
          LIMIT 1) AS oldest_pending
       FROM todos
       WHERE user_id = $1`,
      [req.userId]
    );
    const summary = rows[0];
    const total = summary.total;
    const completed = summary.completed;
    res.json({
      total,
      completed,
      pending: total - completed,
      completionRate: total === 0 ? 0 : Math.round((completed / total) * 1000) / 10,
      oldestPending: summary.oldest_pending,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
  getTodoStats,
};
