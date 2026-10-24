'use client';

import { useEffect, useState } from 'react';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import StatsPanel from '../components/StatsPanel';
import {
  getTodos,
  getStats,
  getCurrentUser,
  exchangeOAuthCode,
  createTodo,
  toggleTodo,
  deleteTodo,
  updateTodo,
  clearCompleted,
  logout,
} from '../lib/api';
import AuthForm from '../components/AuthForm';
import SettingsModal from '../components/SettingsModal';
import ProfileMenu from '../components/ProfileMenu';

export default function HomePage() {
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [ready, setReady] = useState(false);
  const [filters, setFilters] = useState({ search: '', completed: '', priority: '', sort: 'created' });
  const [showSettings, setShowSettings] = useState(false);

  // Load stats ONLY when called explicitly (app load, add, edit, delete)
  async function loadStats() {
    try {
      const data = await getStats();
      setStats(data);
    } catch (_) {
      // Non-blocking
    }
  }

  // Load todos with backend pagination
  async function loadTodos(nextPage = page, nextLimit = limit) {
    try {
      setError('');
      setLoading(true);
      const data = await getTodos(nextPage, nextLimit, filters);
      setTodos(data.items || []);
      setPagination(data.pagination || { page: nextPage, limit: nextLimit, total: 0, totalPages: 1 });
      setPage(nextPage);
    } catch (err) {
      if (err.status === 401) {
        window.localStorage.removeItem('todo_token');
        setUser(null);
        setTodos([]);
        setStats(null);
      }
      setError(err.message);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }

  useEffect(() => {
    document.title = 'Taskflow';
  }, []);

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
        setUser(null);
        setTodos([]);
        setStats(null);
        setError('');
        setReady(true);
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  // When user or filters or limit change, fetch page 1 and load stats
  useEffect(() => {
    if (!user) {
      setTodos([]);
      setStats(null);
      setReady(true);
      return;
    }
    loadTodos(1, limit);
    loadStats();
  }, [user?.id, filters.search, filters.completed, filters.priority, filters.sort, limit]);

  async function handleLogout() {
    try {
      await logout();
    } catch (_) { }
    window.localStorage.removeItem('todo_token');
    setUser(null);
    setTodos([]);
    setStats(null);
    setError('');
  }

  async function handleAdd(data) {
    try {
      await createTodo(data);
      await loadTodos(1, limit);
      await loadStats(); // Update stats on ADD
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(id, data) {
    try {
      await updateTodo(id, data);
      await loadTodos(page, limit);
      await loadStats(); // Update stats on EDIT
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(id) {
    try {
      await toggleTodo(id);
      await loadTodos(page, limit);
      await loadStats(); // Update stats on TOGGLE / EDIT
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTodo(id);
      const remainingOnPage = todos.length - 1;
      const targetPage = remainingOnPage === 0 && page > 1 ? page - 1 : page;
      await loadTodos(targetPage, limit);
      await loadStats(); // Update stats on DELETE
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearCompleted() {
    try {
      await clearCompleted();
      await loadTodos(1, limit);
      await loadStats(); // Update stats on CLEAR COMPLETED
    } catch (err) {
      setError(err.message);
    }
  }

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > (pagination.totalPages || 1)) return;
    loadTodos(newPage, limit);
  }

  function handleLimitChange(e) {
    const newLimit = Number(e.target.value);
    setLimit(newLimit);
  }

  if (!ready) return null;
  if (!user) {
    return (
      <AuthForm
        initialError={error}
        onAuthenticated={(authenticatedUser) => {
          setTodos([]);
          setStats(null);
          setUser(authenticatedUser);
          setPage(1);
        }}
      />
    );
  }

  const total = pagination.total || 0;
  const fromIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const toIndex = Math.min(page * limit, total);
  const totalPages = Math.max(pagination.totalPages || 1, 1);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <div className="brand-mark small">✓</div>
          <h1 className="app-title">Taskflow</h1>
        </div>
        <div className="header-actions">
          <ProfileMenu
            user={user}
            onOpenSettings={() => setShowSettings(true)}
            onLogout={handleLogout}
          />
        </div>
      </header>

      <div className="page-layout">
        <main className="container">
          <TodoForm onAdd={handleAdd} />
          <div className="todo-toolbar">
            <div className="search-wrap">
              <span aria-hidden="true">⌕</span>
              <input
                className="search-input"
                placeholder="Search your tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <select
              value={filters.completed}
              onChange={(e) => setFilters({ ...filters, completed: e.target.value })}
            >
              <option value="">All statuses</option>
              <option value="false">Active</option>
              <option value="true">Completed</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="created">Newest</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
            </select>
            <button className="secondary-button" onClick={handleClearCompleted}>
              Clear completed
            </button>
          </div>

          {loading ? (
            <p className="loading-state">Loading your tasks...</p>
          ) : (
            <TodoList
              todos={todos}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          )}

          {/* Full Pagination Bar */}
          <div className="pagination-bar">
            <div className="pagination-info">
              {total > 0 ? (
                <>
                  Showing <strong>{fromIndex}</strong> to <strong>{toIndex}</strong> of <strong>{total}</strong> tasks
                </>
              ) : (
                <span>No tasks in this view</span>
              )}
            </div>

            <div className="pagination-controls">
              <div className="page-size-selector">
                <label htmlFor="per-page-select">Per page:</label>
                <select id="per-page-select" value={limit} onChange={handleLimitChange}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div className="page-buttons">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  aria-label="Previous page"
                >
                  &larr; Previous
                </button>
                <span className="page-indicator">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  aria-label="Next page"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </div>
        </main>

        <StatsPanel stats={stats} />
      </div>

      <SettingsModal
        user={user}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
        }}
      />
    </div>
  );
}
