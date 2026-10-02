import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  disablePush,
  enablePush,
  getExistingSubscription,
  needsHomeScreenInstall,
  pushConfigured,
  pushSupported,
} from "../lib/push";

export default function PushToggle() {
  const { profile } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supported = pushSupported();

  useEffect(() => {
    if (!supported) return;
    getExistingSubscription()
      .then((sub) => setEnabled(Boolean(sub) && Notification.permission === "granted"))
      .catch(() => {});
  }, [supported]);

  async function toggle() {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
      } else {
        await enablePush(profile.id);
        setEnabled(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  let hint = "Get a ping on this device when your partner adds something.";
  if (needsHomeScreenInstall()) hint = "On iPhone, add the app to your Home Screen first, then turn this on.";
  else if (!supported) hint = "This browser doesn't support push notifications.";
  else if (!pushConfigured) hint = "Push isn't set up yet.";

  const disabled = busy || !supported || !pushConfigured || needsHomeScreenInstall();

  return (
    <div className="bg-surface rounded-soft border border-hairline p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Push notifications</p>
          <p className="text-xs text-dim">{hint}</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          aria-label="Push notifications"
          onClick={toggle}
          disabled={disabled}
          className={`relative h-7 w-12 shrink-0 rounded-pill transition disabled:opacity-40 ${
            enabled ? "bg-rose" : "bg-hairline"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
              enabled ? "left-[1.375rem]" : "left-0.5"
            }`}
          />
        </button>
      </div>
      {error && <p className="mt-3 text-xs text-rose">{error}</p>}
    </div>
  );
}
