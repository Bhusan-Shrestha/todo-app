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

export default function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || '');
  const [priority, setPriority] = useState(todo.priority || 'medium');
  const [dueDate, setDueDate] = useState(toDateInputValue(todo.due_date));
  const formattedDueDate = formatDueDate(todo.due_date);

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
      {editing ? <div className="todo-edit">
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details" />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button onClick={save} disabled={!title.trim()}>Save</button>
        <button onClick={() => setEditing(false)}>Cancel</button>
      </div> : <div className="todo-content">
        <span className="title">{todo.title}</span>
        {todo.description && <small>{todo.description}</small>}
        <span className={`priority priority-${todo.priority || 'medium'}`}>{todo.priority || 'medium'}</span>
        {formattedDueDate && <small>Due {formattedDueDate}</small>}
      </div>}
      {!editing && <button className="edit-btn" onClick={() => setEditing(true)}>Edit</button>}
      <button className="delete-btn" onClick={() => onDelete(todo.id)}>
        Delete
      </button>
    </li>
  );
}
