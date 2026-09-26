import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const { sendPasswordReset, session } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inRecoveryFlow, setInRecoveryFlow] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    // Supabase redirects here with a recovery session already active.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setInRecoveryFlow(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    const { error: err } = await sendPasswordReset(email);
    if (err) setError(err);
    else setSent(true);
  }

  async function updatePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password should be at least 8 characters.");
      return;
    }
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) setError(err.message);
    else setUpdated(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl">🔑</p>
          <h1 className="mt-3 font-display text-2xl">Reset password</h1>
        </div>

        <div className="glass rounded-soft p-6">
          {inRecoveryFlow || session ? (
            updated ? (
              <div className="text-center text-sm">
                <p className="mb-2 text-2xl">✅</p>
                <p>Your password has been updated.</p>
                <Link to="/" className="mt-4 inline-block text-rose">
                  Go to dashboard
                </Link>
              </div>
            ) : (
              <form onSubmit={updatePassword} className="space-y-3">
                <label className="mb-1 block text-xs text-dim">New password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
                  placeholder="At least 8 characters"
                />
                {error && <p className="text-sm text-rose">{error}</p>}
                <button
                  type="submit"
                  className="w-full rounded-pill bg-rose py-2.5 text-sm font-medium text-white transition hover:bg-rose-dark"
                >
                  Update password
                </button>
              </form>
            )
          ) : sent ? (
            <div className="text-center text-sm">
              <p className="mb-2 text-2xl">📬</p>
              <p>Check your email for a reset link.</p>
            </div>
          ) : (
            <form onSubmit={requestReset} className="space-y-3">
              <label className="mb-1 block text-xs text-dim">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
                placeholder="you@example.com"
              />
              {error && <p className="text-sm text-rose">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-pill bg-rose py-2.5 text-sm font-medium text-white transition hover:bg-rose-dark"
              >
                Send reset link
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-dim">
            <Link to="/login" className="text-dim hover:text-rose">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
