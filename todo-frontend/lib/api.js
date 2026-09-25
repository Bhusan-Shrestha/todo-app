const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch (_) {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const getTodos = () => request("/todos");

export const createTodo = (title, description) =>
  request("/todos", {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });

export const updateTodo = (id, data) =>
  request(`/todos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const toggleTodo = (id) =>
  request(`/todos/${id}/toggle`, { method: "PATCH" });

export const deleteTodo = (id) => request(`/todos/${id}`, { method: "DELETE" });

export const getStats = () => request("/todos/stats");
