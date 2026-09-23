import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Feedback";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isUnreachable, retry } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageSpinner />;

  // The token is still valid as far as we know - we just could not reach the
  // API to confirm it. Bouncing to /login here would throw away a good
  // session every time the backend was still waking up.
  if (!isAuthenticated && isUnreachable) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center">
        <p className="font-display text-lg text-bone">Couldn't reach the server.</p>
        <p className="max-w-sm text-sm text-bone-dim">
          You're still signed in. The API may be waking up - this can take up to a minute on a free plan.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Button onClick={retry}>Try again</Button>
          <a href="/" className="font-mono text-xs text-bone-faint hover:text-bone-dim">
            ← Back to the site
          </a>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
