// Thin API client. The bundle is served from the same origin as the API, so
// requests are relative and no CORS is involved.

const TOKEN_KEY = "cc_operator_token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // private browsing, blocked storage
  }
};

export const setToken = (token) => {
  try {
    token
      ? localStorage.setItem(TOKEN_KEY, token)
      : localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* session lasts the tab, which is better than failing outright */
  }
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  // 401 means the token is gone or expired; drop it so the UI falls back to
  // the login screen instead of looping on failed requests.
  if (res.status === 401) {
    setToken(null);
    throw new ApiError("Your session expired. Please sign in again.", 401);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  del: (path) => request("DELETE", path),
};

// Turns snake_case column names into readable labels.
export const humanize = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/\burl\b/i, "URL")
    .replace(/\bid\b/i, "ID")
    .replace(/^./, (c) => c.toUpperCase());

export const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && (value === 0 || value === 1)) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleString();
  }
  return value;
};
