function getApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.API_URL) return process.env.API_URL;
  if (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:4000/api";
  }
  return "/api";
}

export function getOAuthUrl(provider) {
  const returnTo = typeof window !== "undefined" ? window.location.origin : "";
  const params = returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : "";
  return `${getApiUrl()}/auth/oauth/${provider}${params}`;
}

export const exchangeOAuthCode = (code) =>
  request("/auth/oauth/exchange", { method: "POST", body: JSON.stringify({ code }) });

async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("todo_token") : null;
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch (_) {
      // Ignore non-JSON error bodies.
    }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const register = (name, email, password, confirmPassword) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, confirmPassword }),
  });

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const logout = () => request("/auth/logout", { method: "POST" });
export const getCurrentUser = () => request("/auth/me");
export const getTodos = (page = 1, limit = 10, filters = {}) => {
  const params = new URLSearchParams({ page, limit, ...filters });
  return request(`/todos?${params.toString()}`);
};

export const createTodo = (data) =>
  request("/todos", { method: "POST", body: JSON.stringify(data) });

export const updateTodo = (id, data) =>
  request(`/todos/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const toggleTodo = (id) => request(`/todos/${id}/toggle`, { method: "PATCH" });
export const deleteTodo = (id) => request(`/todos/${id}`, { method: "DELETE" });
export const clearCompleted = () => request("/todos/completed", { method: "DELETE" });
export const getStats = () => request("/todos/stats");
export const updateProfile = (data) =>
  request("/auth/profile", { method: "PATCH", body: JSON.stringify(data) });
export const changePassword = (data) =>
  request("/auth/change-password", { method: "POST", body: JSON.stringify(data) });
