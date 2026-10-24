'use client';

import { useState } from 'react';

function toDateInputValue(value) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function formatDueDate(value) {
  const inputValue = toDateInputValue(value);
  if (!inputValue) return null;
  const [year, month, day] = inputValue.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function isDueToday(value) {
  const inputValue = toDateInputValue(value);
  if (!inputValue) return false;
  const today = new Date().toISOString().slice(0, 10);
  return inputValue === today;
}

function isOverdue(value) {
  const inputValue = toDateInputValue(value);
  if (!inputValue) return false;
  const today = new Date().toISOString().slice(0, 10);
  return inputValue < today;
}

export default function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || '');
  const [priority, setPriority] = useState(todo.priority || 'medium');
  const [dueDate, setDueDate] = useState(toDateInputValue(todo.due_date));
  const formattedDueDate = formatDueDate(todo.due_date);
  const overdue = !todo.completed && isOverdue(todo.due_date);
  const dueToday = !todo.completed && isDueToday(todo.due_date);

  async function save() {
    await onUpdate(todo.id, { title: title.trim(), description, priority, dueDate });
    setEditing(false);
  }

  return (
    <li className={`todo-item${todo.completed ? ' completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />

      {editing ? (
        <div className="todo-edit">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            autoFocus
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button onClick={save} disabled={!title.trim()}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="todo-content">
          <span className="title">{todo.title}</span>
          {todo.description && <small className="todo-desc">{todo.description}</small>}
          <div className="todo-meta">
            <span className={`priority priority-${todo.priority || 'medium'}`}>
              {todo.priority || 'medium'}
            </span>
            {formattedDueDate && (
              <span className={`due-date-badge${overdue ? ' overdue' : dueToday ? ' due-today' : ''}`}>
                {overdue ? '⚠ ' : dueToday ? '📅 ' : ''}Due {formattedDueDate}
              </span>
            )}
          </div>
        </div>
      )}

      {!editing && (
        <>
          <button className="edit-btn" onClick={() => setEditing(true)} title="Edit task" aria-label="Edit task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <button className="delete-btn" onClick={() => onDelete(todo.id)} title="Delete task" aria-label="Delete task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </>
      )}
    </li>
  );
}
