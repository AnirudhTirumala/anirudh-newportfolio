import axios from "axios";

const TOKEN_KEY = "portfolio_admin_token";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  // Kept short deliberately: this site is designed to also run as a
  // standalone static frontend (see hooks/usePortfolio.ts), so a missing or
  // sleeping backend should fail fast into the bundled fallback content
  // rather than leaving a visitor staring at a spinner.
  timeout: 3000,
});

// Admin-uploaded files (certificate photos, etc.) come back from the API as
// a path like `/uploads/certificates/x.jpg`, relative to the *backend* - not
// wherever the frontend happens to be served from. A plain `<img src>`
// resolves against the current page's origin, so in dev (frontend on 5173,
// API on 8000) an unresolved path 404s. Stitch the API's own origin on.
export function resolveUploadUrl(path: string): string {
  // Uploaded certificates are always stored under this backend-owned path.
  // Do not turn arbitrary strings from the API into remote image requests.
  if (!path.startsWith("/uploads/certificates/")) return "";
  return `${apiClient.defaults.baseURL}${path}`;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the token is missing/expired - drop it so the UI falls back
// to the logged-out state instead of retrying with a dead token.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (error.message) return error.message;
  }
  return fallback;
}
