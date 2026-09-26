import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/timeline", label: "Memories", icon: "❤️" },
  { to: "/calendar", label: "Calendar", icon: "📅" },
  { to: "/gallery", label: "Gallery", icon: "📸" },
  { to: "/story", label: "Our Story", icon: "💌" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function Navigation() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-hairline bg-surface px-4 py-6 md:flex">
        <div className="mb-8 px-2">
          <p className="font-display text-lg leading-tight">Ester ❤️ Kypher</p>
          <p className="text-xs text-dim">🔒 Private space</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive ? "bg-rose/15 text-rose font-medium" : "text-dim hover:bg-surface-raised hover:text-current"
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => navigate("/memory/new")}
          className="mb-3 flex items-center justify-center gap-2 rounded-pill bg-rose py-2.5 text-sm font-medium text-white transition hover:bg-rose-dark"
        >
          + Add memory
        </button>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-dim">{profile?.full_name}</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-around px-2 py-2 md:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] transition ${
                isActive ? "text-rose" : "text-dim"
              }`
            }
          >
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Floating add button (mobile) */}
      <button
        onClick={() => navigate("/memory/new")}
        aria-label="Add memory"
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-rose text-2xl text-white shadow-glass transition hover:bg-rose-dark md:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.75rem)" }}
      >
        +
      </button>
    </>
  );
}
