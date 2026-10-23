'use client';

import { useState } from 'react';

export default function TodoForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd({ title: title.trim(), description, priority, dueDate });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="todo-form-card" onSubmit={handleSubmit}>
      <div className="composer-heading">
        <div><p className="eyebrow">QUICK CAPTURE</p><h2>What needs doing?</h2></div>
      </div>
      <div className="todo-form">
        <input autoFocus type="text" placeholder="e.g. Prepare tomorrow's presentation"
          value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
        <input type="text" placeholder="Add a note (optional)" value={description}
          onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
          <option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
        <button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? 'Adding...' : 'Add task'}
        </button>
      </div>
    </form>
  );
}
