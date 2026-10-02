import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { session, signInWithPassword, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error: err } = await signInWithPassword(email, password);
    setSubmitting(false);
    if (err) setError(err);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl">❤️</p>
          <h1 className="mt-3 font-display text-2xl">Ester &amp; Kypher</h1>
          <p className="mt-1 text-sm text-dim">Our private story, just for us.</p>
        </div>

        <div className="glass rounded-soft p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-dim">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg glass-input px-3 py-2.5 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-dim">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg glass-input px-3 py-2.5 text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-rose">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-pill btn-rose py-2.5 text-sm font-medium text-white transition disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-dim">
            <div className="h-px flex-1 bg-hairline" />
            or
            <div className="h-px flex-1 bg-hairline" />
          </div>

          <button
            onClick={() => signInWithGoogle()}
            className="w-full rounded-pill border border-hairline py-2.5 text-sm font-medium transition hover:bg-surface-raised"
          >
            Continue with Google
          </button>

          <div className="mt-5 flex items-center justify-between text-xs">
            <Link to="/reset-password" className="text-dim hover:text-rose">
              Forgot password?
            </Link>
            <Link to="/signup" className="text-dim hover:text-rose">
              Create account
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-dim">🔒 Private — Ester &amp; Kypher only</p>
      </div>
    </div>
  );
}
