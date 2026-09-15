import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { apiErrorMessage } from "@/api/client";
import { CornerFrame } from "@/components/ui/CornerFrame";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      const from = (location.state as { from?: Location })?.from;
      navigate(from?.pathname || "/admin", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Incorrect username or password."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6">
      <Link to="/" className="mb-10">
        <CornerFrame color="scope" className="inline-flex h-10 w-10 items-center justify-center">
          <span className="font-display text-sm font-semibold text-bone">AT</span>
        </CornerFrame>
      </Link>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2 text-bone-dim">
          <Lock className="h-4 w-4" />
          <p className="font-display text-sm">Admin sign in</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <Link to="/" className="mt-8 inline-block font-mono text-xs text-bone-faint hover:text-bone-dim">
          ← Back to the site
        </Link>
      </div>
    </div>
  );
}
