'use client';

import { useEffect, useState } from 'react';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import StatsPanel from '../components/StatsPanel';
import { getTodos, createTodo, toggleTodo, deleteTodo } from '../lib/api';

export default function HomePage() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTodos() {
    try {
      setError('');
      const data = await getTodos();
      setTodos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  async function handleAdd(title) {
    try {
      const newTodo = await createTodo(title);
      setTodos((prev) => [newTodo, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(id) {
    try {
      const updated = await toggleTodo(id);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-layout">
      <main className="container">
        <h1>Todo List</h1>
        {error && <div className="error-banner">{error}</div>}
        <TodoForm onAdd={handleAdd} />
        {loading ? <p>Loading...</p> : (
          <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />
        )}
      </main>
      <StatsPanel />
    </div>
  );
}
