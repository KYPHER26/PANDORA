import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("ek-install-dismissed") === "1");

  useEffect(() => {
    if (isStandalone()) return; // already installed, never show

    function handler(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);

    if (isIos()) {
      setShowIosHint(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("ek-install-dismissed", "1");
  }

  async function install() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }

  if (dismissed || (!deferredEvent && !showIosHint)) return null;

  return (
    <div className="glass fixed inset-x-4 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-50 flex items-center gap-3 rounded-soft p-3 shadow-glass animate-riseIn md:inset-x-auto md:left-1/2 md:w-full md:max-w-sm md:-translate-x-1/2">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-xl">❤️</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">Install Ester &amp; Kypher</p>
        <p className="truncate text-xs text-dim">
          {showIosHint && !deferredEvent
            ? "Tap Share, then Add to Home Screen"
            : "Add it to your home screen"}
        </p>
      </div>
      {deferredEvent && (
        <button
          onClick={install}
          className="shrink-0 rounded-pill btn-rose px-4 py-2 text-sm font-medium text-white transition"
        >
          Install
        </button>
      )}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-lg text-dim hover:text-current"
      >
        ✕
      </button>
    </div>
  );
}
