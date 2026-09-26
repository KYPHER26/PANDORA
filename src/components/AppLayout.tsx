import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navigation from "./Navigation";

export default function AppLayout() {
  const { couple, profile, signOut } = useAuth();

  if (!couple) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-4xl">💌</p>
        <h1 className="mt-4 font-display text-xl">Almost there, {profile?.full_name}</h1>
        <p className="mt-2 max-w-sm text-sm text-dim">
          Your account is ready, but you're not linked to a couple space yet. Ask whoever set up this app to run the
          couple-linking step in Supabase once both of you have signed up.
        </p>
        <button
          onClick={() => signOut()}
          className="mt-6 rounded-pill border border-hairline px-5 py-2 text-sm transition hover:bg-surface-raised"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:ml-60 md:max-w-3xl md:px-8 md:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
