import axios from "axios";
import { notifyPortfolioChanged } from "@/lib/portfolioSync";

const TOKEN_KEY = "portfolio_admin_token";
const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
const API_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout >= 1_000 ? configuredTimeout : 30_000;

/** Fired when the API rejects our token. `AuthContext` listens and drops the
 * signed-in UI, so the admin lands back on the login screen instead of sitting
 * in an editor where every button silently fails. */
export const AUTH_EXPIRED_EVENT = "portfolio-auth-expired";

const LOGIN_PATH = "/api/auth/login";

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
const UPLOAD_PREFIXES = ["/uploads/certificates/", "/uploads/resume/"];

export function resolveUploadUrl(path: string): string {
  // Uploads are always stored under one of these backend-owned paths. Do not
  // turn arbitrary strings from the API into remote requests, and reject any
  // attempt to climb out of the directory the prefix names.
  if (!UPLOAD_PREFIXES.some((prefix) => path.startsWith(prefix)) || path.includes("..")) return "";
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

apiClient.interceptors.response.use(
  (response) => {
    if (isPortfolioContentWrite(response.config.url, response.config.method)) {
      notifyPortfolioChanged();
    }
    return response;
  },
  (error) => {
    // A 401 on a normal request means the token is gone or expired. Clearing
    // it is not enough on its own: without this event the admin UI still
    // believed it was signed in, so every button kept firing requests that
    // died with no visible error. A failed *login* is a wrong password, not
    // an expired session, so it must not trigger the sign-out path.
    const url = error.config?.url ?? "";
    if (error.response?.status === 401 && !url.includes(LOGIN_PATH)) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

/** FastAPI returns 422 validation problems as a list of
 * `{ loc: [...], msg, type }` objects. Rendering that object as-is produced
 * "Request failed with status code 422", which tells the owner nothing about
 * which field the backend actually rejected. */
function formatValidationDetail(detail: unknown): string | null {
  if (!Array.isArray(detail) || detail.length === 0) return null;

  const messages = detail
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return null;
      const entry = item as { loc?: unknown; msg?: unknown };
      // Pydantic prefixes messages raised by a custom validator with
      // "Value error, ", which is implementation noise to whoever is looking
      // at the form.
      const message = typeof entry.msg === "string" ? entry.msg.replace(/^Value error,\s*/i, "") : null;
      if (!message) return null;
      // `loc` is like ["body", "github_url"] - the last string segment is the
      // field name the owner actually recognises from the form.
      const field = Array.isArray(entry.loc)
        ? [...entry.loc].reverse().find((part): part is string => typeof part === "string" && part !== "body")
        : undefined;
      return field ? `${field}: ${message}` : message;
    })
    .filter((value): value is string => Boolean(value));

  return messages.length ? messages.join(" · ") : null;
}

export function apiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") return detail;

    const validation = formatValidationDetail(detail);
    if (validation) return validation;

    if (error.code === "ECONNABORTED") {
      return "The server took too long to respond. It may be waking up - please try again in a moment.";
    }
    if (!error.response) {
      return "Couldn't reach the server. Check your connection and try again.";
    }
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You don't have permission to do that.";
    if (status === 404) return "That item no longer exists. It may have been deleted already.";
    if (status === 413) return "That file is too large to upload.";
    if (status === 429) return "Too many attempts. Please wait a moment and try again.";
    if (status && status >= 500) return "The server hit an error. Please try again in a moment.";

    if (error.message) return error.message;
  }
  return fallback;
}
