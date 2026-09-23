import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { LogOut, ExternalLink, Menu, X } from "lucide-react";
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

function navLinkClasses({ isActive }: { isActive: boolean }): string {
  return cn(
    "rounded-md px-3 py-2 font-display text-sm transition-colors",
    isActive ? "bg-scope/10 text-scope" : "text-bone-dim hover:bg-ink-800 hover:text-bone",
  );
}

export default function AdminLayout() {
  const { username, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // The panel overlays the page it navigates away from, so leaving it open
  // across a route change would hide the section the owner just picked.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 sm:flex-row">
      {/* The sidebar below is desktop-only. Without this header a phone had no
          section links and no way to sign out at all - the only way out of an
          editor was the browser's back button. */}
      <div className="sticky top-0 z-30 border-b border-ink-700 bg-ink-950 sm:hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <div className="min-w-0">
            <Link to="/" className="font-display text-sm text-bone">
              Anirudh Tirumala
            </Link>
            <p className="truncate font-mono text-xs text-bone-faint">Signed in as {username}</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-nav"
            aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
            className="shrink-0 rounded-md border border-ink-700 p-2 text-bone-dim transition-colors hover:border-scope hover:text-scope"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div id="admin-mobile-nav" className="border-t border-ink-700 px-4 pb-4 pt-3">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClasses}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-ink-700 pt-3">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 font-mono text-xs text-bone-faint hover:text-bone-dim"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View live site
              </a>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 font-mono text-xs text-bone-faint hover:text-danger"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-700 px-6 py-8 sm:flex">
        <Link to="/" className="font-display text-sm text-bone">
          Anirudh Tirumala
        </Link>
        <p className="mt-1 font-mono text-xs text-bone-faint">Signed in as {username}</p>

        <nav className="mt-10 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClasses}>
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
