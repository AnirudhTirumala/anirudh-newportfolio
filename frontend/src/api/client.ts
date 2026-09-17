import axios from "axios";
import { notifyPortfolioChanged } from "@/lib/portfolioSync";

const TOKEN_KEY = "portfolio_admin_token";
const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
const API_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout >= 1_000 ? configuredTimeout : 30_000;

const PORTFOLIO_CONTENT_PATHS = [
  "/api/profile",
  "/api/experiences",
  "/api/skills",
  "/api/projects",
  "/api/education",
  "/api/certificates",
  "/api/languages",
];

function isPortfolioContentWrite(url: string | undefined, method: string | undefined): boolean {
  if (!url || !method || !["post", "put", "patch", "delete"].includes(method.toLowerCase())) return false;
  const path = url.split("?")[0];
  return PORTFOLIO_CONTENT_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  // The public page renders its bundled fallback immediately, so this request
  // can wait long enough for Render Free to wake without blocking the UI.
  // A three-second timeout made a sleeping API look permanently unavailable.
  timeout: API_TIMEOUT_MS,
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
  (response) => {
    if (isPortfolioContentWrite(response.config.url, response.config.method)) {
      notifyPortfolioChanged();
    }
    return response;
  },
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
