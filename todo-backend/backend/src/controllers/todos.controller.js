const pool = require('../db');
const statsClient = require('../services/stats.client');

// GET /api/todos?completed=true|false
async function getTodos(req, res, next) {
  try {
    const { completed } = req.query;
    let query = 'SELECT * FROM todos';
    const params = [];

    if (completed === 'true' || completed === 'false') {
      params.push(completed === 'true');
      query += ' WHERE completed = $1';
    }
    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/todos/:id
async function getTodoById(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Todo not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/todos
async function createTodo(req, res, next) {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO todos (title, description) VALUES ($1, $2) RETURNING *',
      [title.trim(), description || null]
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
    const { title, description, completed } = req.body;

    const { rows: existingRows } = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Todo not found' });
    const existing = existingRows[0];

    const { rows } = await pool.query(
      `UPDATE todos
       SET title = $1, description = $2, completed = $3
       WHERE id = $4
       RETURNING *`,
      [
        title !== undefined ? title : existing.title,
        description !== undefined ? description : existing.description,
        completed !== undefined ? completed : existing.completed,
        id,
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
      'UPDATE todos SET completed = NOT completed WHERE id = $1 RETURNING *',
      [id]
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
    const { rows } = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Todo not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// GET /api/todos/stats
// Reads the todos from Postgres, then asks the todo-stats microservice
// (running on a worker node) to calculate the numbers.
async function getTodoStats(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, completed, created_at FROM todos'
    );
    const stats = await statsClient.getStats(rows);
    res.json(stats);
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
  getTodoStats,
};
