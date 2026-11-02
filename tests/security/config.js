export const APP_MODE = process.env.APP_MODE || "vulnerable";

if (!["vulnerable", "secure"].includes(APP_MODE)) {
  throw new Error('APP_MODE must be "vulnerable" or "secure"');
}

export const isSecure = APP_MODE === "secure";
export const API_URL = isSecure ? "http://127.0.0.1:3002/api" : "http://127.0.0.1:3001/api";

export async function apiRequest(path, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  return {
    status: response.status,
    data,
  };
}