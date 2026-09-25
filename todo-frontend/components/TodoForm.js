'use client';

import { useState } from 'react';

export default function TodoForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(title.trim());
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="What needs doing?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
      />
      <button type="submit" disabled={submitting || !title.trim()}>
        Add
      </button>
    </form>
  );
}
