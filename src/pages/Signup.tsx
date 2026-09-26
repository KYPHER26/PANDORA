import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { session, signUpWithPassword, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password should be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await signUpWithPassword(email, password, fullName);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      setDone(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl">❤️</p>
          <h1 className="mt-3 font-display text-2xl">Join your story</h1>
          <p className="mt-1 text-sm text-dim">Only Ester and Kypher belong here.</p>
        </div>

        <div className="glass rounded-soft p-6">
          {done ? (
            <div className="text-center text-sm">
              <p className="mb-2 text-2xl">📬</p>
              <p>Check your email to confirm your account, then sign in.</p>
              <Link to="/login" className="mt-4 inline-block text-rose">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-dim">Your name</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
                    placeholder="Ester or Kypher"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-dim">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
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
                    className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
                    placeholder="At least 8 characters"
                  />
                </div>

                {error && <p className="text-sm text-rose">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-pill bg-rose py-2.5 text-sm font-medium text-white transition hover:bg-rose-dark disabled:opacity-60"
                >
                  {submitting ? "Creating account…" : "Create account"}
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

              <p className="mt-5 text-center text-xs text-dim">
                Already have an account?{" "}
                <Link to="/login" className="text-rose">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
