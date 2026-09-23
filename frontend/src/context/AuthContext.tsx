import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { AUTH_EXPIRED_EVENT, clearToken, getToken, setToken as persistToken } from "@/api/client";
import { getMe, login as loginRequest } from "@/api/endpoints";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  /** The API could not be reached while checking an existing token. The token
   * has deliberately been kept - this is a connectivity problem, not a signed
   * out session. */
  isUnreachable: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnreachable, setIsUnreachable] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setIsUnreachable(false);

    getMe()
      .then((me) => {
        if (cancelled) return;
        setUsername(me.username);
        setIsAuthenticated(true);
        setIsUnreachable(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Only a 401 means the token is genuinely dead. A timeout, a 502 while
        // Render Free wakes up, or any network failure used to delete a
        // perfectly valid token and force a fresh password entry on every
        // cold start - keep it and offer a retry instead.
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status === 401) {
          clearToken();
          setIsAuthenticated(false);
          setIsUnreachable(false);
        } else {
          setIsAuthenticated(false);
          setIsUnreachable(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // The axios interceptor clears the token as soon as the API rejects it.
  // Without this the UI stayed in its signed-in state and every subsequent
  // admin action failed silently.
  useEffect(() => {
    const onExpired = () => {
      setIsAuthenticated(false);
      setUsername(null);
      setIsUnreachable(false);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (usernameInput: string, password: string) => {
    const token = await loginRequest(usernameInput, password);
    persistToken(token);
    const me = await getMe();
    setUsername(me.username);
    setIsAuthenticated(true);
    setIsUnreachable(false);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
    setUsername(null);
    setIsUnreachable(false);
  }, []);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, isUnreachable, username, login, logout, retry }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
