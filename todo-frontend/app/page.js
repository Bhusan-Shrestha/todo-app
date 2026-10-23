'use client';

import { useEffect, useState } from 'react';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import StatsPanel from '../components/StatsPanel';
import { getTodos, getCurrentUser, exchangeOAuthCode, createTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted, logout } from '../lib/api';
import AuthForm from '../components/AuthForm';

export default function HomePage() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [ready, setReady] = useState(false);
  const [filters, setFilters] = useState({ search: '', completed: '', priority: '', sort: 'created' });

  async function loadTodos(nextPage = page) {
    try {
      setError('');
      const data = await getTodos(nextPage, 10, filters);
      setTodos(data.items);
      setPagination(data.pagination);
    } catch (err) {
      if (err.status === 401) {
        window.localStorage.removeItem('todo_token');
        setUser(null);
      }
      setError(err.message);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }

  useEffect(() => {
    async function restoreSession() {
      const params = new URLSearchParams(window.location.search);
      const oauthCode = params.get('oauth_code');
      const oauthError = params.get('oauth_error');
      if (oauthCode) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      if (oauthError) {
        setError(oauthError);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (oauthCode) {
        try {
          const data = await exchangeOAuthCode(oauthCode);
          window.localStorage.setItem('todo_token', data.token);
        } catch (err) {
          setError(err.message);
          setReady(true);
          setLoading(false);
          return;
        }
      }

      if (!window.localStorage.getItem('todo_token')) {
        setReady(true);
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();
        setUser(data.user);
      } catch (err) {
        window.localStorage.removeItem('todo_token');
        setError('');
        setReady(true);
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }
    setPage(1);
    loadTodos(1);
  }, [filters.search, filters.completed, filters.priority, filters.sort]);

  async function handleAdd(data) {
    try {
      const newTodo = await createTodo(data);
      if (page === 1) setTodos((prev) => [newTodo, ...prev].slice(0, pagination.limit || 10));
      else loadTodos(page);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(id, data) {
    try {
      const updated = await updateTodo(id, data);
      setTodos((prev) => prev.map((todo) => todo.id === id ? updated : todo));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearCompleted() {
    try {
      await clearCompleted();
      loadTodos(page);
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
      const remaining = todos.filter((t) => t.id !== id);
      if (remaining.length === 0 && page > 1) {
        setPage(page - 1);
        loadTodos(page - 1);
      } else {
        setTodos(remaining);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (!ready) return null;
  if (!user) return <AuthForm initialError={error} onAuthenticated={(authenticatedUser) => { setUser(authenticatedUser); setPage(1); }} />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <h1 className="app-title">Todo List</h1>
          <div className="user-details">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>
        <button className="logout-button" onClick={async () => { await logout(); window.localStorage.removeItem('todo_token'); setUser(null); }}>Log out</button>
      </header>
      <div className="page-layout">
      <main className="container">
        <TodoForm onAdd={handleAdd} />
        <div className="todo-toolbar">
          <div className="search-wrap"><span aria-hidden="true">⌕</span><input className="search-input" placeholder="Search your tasks..." value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
          <select value={filters.completed} onChange={(e) => setFilters({ ...filters, completed: e.target.value })}>
            <option value="">All statuses</option><option value="false">Active</option><option value="true">Completed</option>
          </select>
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
            <option value="created">Newest</option><option value="due">Due date</option><option value="priority">Priority</option>
          </select>
          <button className="secondary-button" onClick={handleClearCompleted}>Clear completed</button>
        </div>
        {loading ? <p>Loading...</p> : (
          <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />
        )}
        {pagination.totalPages > 1 && <div className="pagination">
          <button disabled={page <= 1} onClick={() => { setPage(page - 1); loadTodos(page - 1); }}>Previous</button>
          <span>Page {page} of {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => { setPage(page + 1); loadTodos(page + 1); }}>Next</button>
        </div>}
      </main>
      <StatsPanel />
      </div>
    </div>
  );
}
