import { NavLink, Outlet, Link } from "react-router-dom";
import { LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/profile", label: "Profile" },
  { to: "/admin/experience", label: "Experience" },
  { to: "/admin/projects", label: "Projects" },
  { to: "/admin/skills", label: "Skills" },
  { to: "/admin/credentials", label: "Education & Certificates" },
];

export default function AdminLayout() {
  const { username, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-ink-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-700 px-6 py-8 sm:flex">
        <Link to="/" className="font-display text-sm text-bone">
          Anirudh Tirumala
        </Link>
        <p className="mt-1 font-mono text-xs text-bone-faint">Signed in as {username}</p>

        <nav className="mt-10 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 font-display text-sm transition-colors",
                  isActive ? "bg-scope/10 text-scope" : "text-bone-dim hover:bg-ink-800 hover:text-bone",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-mono text-xs text-bone-faint hover:text-bone-dim"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View live site
          </a>
          <button onClick={logout} className="flex items-center gap-2 font-mono text-xs text-bone-faint hover:text-danger">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-6 py-8 sm:px-12 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
}
