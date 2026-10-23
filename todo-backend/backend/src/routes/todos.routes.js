const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
  getTodoStats,
} = require('../controllers/todos.controller');

const router = express.Router();
router.use(requireAuth);

router.get('/', getTodos);
// Must be BEFORE '/:id', otherwise Express treats the word "stats" as an id
router.get('/stats', getTodoStats);
router.delete('/completed', clearCompleted);
router.get('/:id', getTodoById);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.patch('/:id/toggle', toggleTodo);
router.delete('/:id', deleteTodo);

module.exports = router;
