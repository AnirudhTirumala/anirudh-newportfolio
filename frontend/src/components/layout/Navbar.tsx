import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, Download } from "lucide-react";
import { InstrumentField } from "@/components/ui/InstrumentField";
import { buttonVariants } from "@/components/ui/Button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { resolveResumeUrl } from "@/lib/urls";
import type { Profile } from "@/types";

interface NavLink {
  label: string;
  href: string;
  /** Sections that unmount when the owner empties them in Admin. */
  requires?: "projects" | "experience";
}

const links: NavLink[] = [
  { label: "Home", href: "/#top" },
  { label: "Work", href: "/#work", requires: "projects" },
  { label: "About", href: "/#about" },
  { label: "Experience", href: "/#experience", requires: "experience" },
  { label: "Contact", href: "/#contact" },
];

function sectionIdOf(href: string): string {
  return href.split("#")[1] ?? "";
}

interface Props {
  profile?: Profile;
  hasProjects?: boolean;
  hasExperience?: boolean;
}

export function Navbar({ profile, hasProjects = true, hasExperience = true }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const location = useLocation();
  const resumeUrl = resolveResumeUrl(profile?.resume_url);
  const name = profile?.name || "Anirudh Tirumala";
  const title = profile?.title || "AI Engineer";
  // A link to a section that is not going to render is a dead control: the
  // address bar picks up the fragment and nothing else happens.
  const visibleLinks = links.filter((link) =>
    link.requires === "projects" ? hasProjects : link.requires === "experience" ? hasExperience : true,
  );
  // An array literal would be a new dependency on every render, so the set of
  // sections to watch travels through the effect as a single string.
  const linkKey = visibleLinks.map((link) => link.href).join("|");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      // Read position is a measurement, so it is written straight to the
      // element rather than through state - this fires on every scroll frame
      // and must not re-render the header.
      const track = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = track > 0 ? Math.min(1, Math.max(0, window.scrollY / track)) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    // Which section the visitor is actually reading, so the bar can report it
    // instead of just listing destinations. The band is a thin slice across
    // the middle of the viewport: a section counts as current once it reaches
    // the centre of the screen, not the moment its first pixel appears.
    const ids = linkKey
      .split("|")
      .map(sectionIdOf)
      .filter(Boolean);
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (targets.length === 0) {
      setActiveId(null);
      return;
    }

    // Document order, not nav order - the nav lists Work before About while
    // the page has them the other way round.
    const ordered = targets.slice().sort((a, b) => a.offsetTop - b.offsetTop).map((el) => el.id);
    const inBand = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        }
        // Clearing when the band is empty matters on a project page, where
        // the only target present is the footer: the readout has to go quiet
        // rather than keep reporting the section the visitor left behind.
        const current = [...ordered].reverse().find((id) => inBand.has(id));
        setActiveId(current ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [linkKey, location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!menuOpen) return;
    // The panel locks background scroll, so it must have an exit that does
    // not depend on finding the small close button.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    // Browsers that support theme-color use this for the mobile browser bar
    // and installed-PWA frame. Desktop tab-strip color remains browser-owned.
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = scrolled || menuOpen ? "#0e0e0f" : "#060606";
  }, [menuOpen, scrolled]);

  const lifted = scrolled || menuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        lifted ? "bg-ink-950/75" : "bg-transparent"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-6xl px-6 sm:px-10"
      >
        <div
          className={`flex items-center justify-between transition-[padding] duration-300 ${
            lifted ? "py-3.5" : "py-5"
          }`}
        >
          <Link
            to="/#top"
            aria-label="Anirudh Tirumala — home"
            className="group inline-flex min-w-0 items-center gap-3"
          >
            <Monogram />
            <span className="flex min-w-0 flex-col leading-none">
              <span className="truncate font-display text-[0.9rem] font-semibold tracking-[-0.01em] text-bone transition-colors duration-300 group-hover:text-scope-bright">
                {name}
              </span>
              <span className="mt-1.5 hidden truncate font-mono text-[0.55rem] uppercase tracking-[0.24em] text-bone-faint sm:block">
                {title}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {/* Router links, not raw `href`s: from a project page a bare
                `/#work` is a full document navigation, which tears the SPA
                down and then resolves the fragment before React has
                rendered the target - so the visitor lands at the top of a
                cold page instead of at the section. `ScrollManager` in
                App.tsx performs the scroll once the route has committed. */}
            {visibleLinks.map((link) => {
              const active = activeId !== null && activeId === sectionIdOf(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={active ? "true" : undefined}
                  className="group relative px-3 py-2 font-display text-sm"
                >
                  <span
                    className={`transition-colors duration-200 ${
                      active ? "text-bone" : "text-bone-dim group-hover:text-bone"
                    }`}
                  >
                    {link.label}
                  </span>
                  {/* A hairline that only shows the pointer where it is. The
                      active readout below is the one that carries meaning. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3 bottom-1 h-px bg-bone/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  />
                  {active && (
                    <motion.span
                      layoutId="nav-readout"
                      aria-hidden
                      transition={
                        reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38, mass: 0.7 }
                      }
                      className="pointer-events-none absolute inset-x-2 bottom-0.5 flex h-2 items-start justify-between"
                    >
                      {/* Caliper jaws either side of a lit rule: the bar
                          measures off the section you are in rather than
                          underlining a word. */}
                      <span className="h-2 w-px bg-scope/70" />
                      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-scope/30 via-scope to-scope/30 shadow-[0_0_10px_rgba(199,228,255,0.5)]" />
                      <span className="h-2 w-px bg-scope/70" />
                    </motion.span>
                  )}
                </Link>
              );
            })}
            {resumeUrl && (
              <>
                <span aria-hidden className="mx-3 h-4 w-px bg-ink-700" />
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants(
                    "secondary",
                    "sm",
                    "gap-1.5 rounded-full border-bone/15 text-bone-dim hover:border-scope/60 hover:text-scope-bright",
                  )}
                >
                  <Download className="h-3.5 w-3.5" /> Resume
                </a>
              </>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-bone/12 bg-ink-900/78 text-bone transition-colors duration-200 hover:border-scope/50 hover:text-scope-bright sm:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      {/* The scrolled state is a seam rather than a shadow: a hairline with a
          lit segment that tracks how far down the document the visitor is.
          The open menu takes the header down to the bottom of the screen, so
          the seam steps aside for it rather than floating under the panel. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-bone/15 to-transparent transition-opacity duration-300 ${
          scrolled && !menuOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <span
        ref={progressRef}
        aria-hidden
        style={{ transform: "scaleX(0)" }}
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-scope/70 transition-opacity duration-300 ${
          scrolled && !menuOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="relative min-h-[calc(100dvh-4.5rem)] overflow-hidden border-t border-ink-700 bg-ink-950/95 sm:hidden"
          >
            <InstrumentField className="opacity-40" marks={false} />
            <div className="relative px-6 pb-12 pt-7">
              <p className="font-mono text-[0.6rem] tracking-[0.24em] text-bone-faint">NAVIGATION</p>

              <div className="relative mt-5 pl-6">
                <span aria-hidden className="absolute bottom-3 left-0 top-3 w-px bg-ink-700" />
                {/* Each link closes the menu itself. The location effect above is
                    only a backstop: tapping the section you are already on moves
                    no part of the location, and a menu left open keeps the body
                    scroll-locked, which reads as a frozen site. */}
                {visibleLinks.map((link, index) => {
                  const active = activeId !== null && activeId === sectionIdOf(link.href);
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.04 * index }}
                    >
                      <Link
                        to={link.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={active ? "true" : undefined}
                        className="group relative flex items-center justify-between border-b border-ink-800/80 py-4"
                      >
                        {/* The tick grows out of the guide rule for the section
                            being read, so the menu reports position too. */}
                        <span
                          aria-hidden
                          className={`absolute -left-6 top-1/2 h-px -translate-y-1/2 bg-scope transition-all duration-300 ${
                            active ? "w-5 opacity-100" : "w-2.5 opacity-30"
                          }`}
                        />
                        <span
                          className={`font-display text-[1.6rem] leading-none tracking-[-0.02em] ${
                            active ? "text-bone" : "text-bone-dim"
                          }`}
                        >
                          {link.label}
                        </span>
                        {active && (
                          <span className="font-mono text-[0.55rem] tracking-[0.2em] text-scope">CURRENT</span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className={buttonVariants(
                    "secondary",
                    "md",
                    "mt-8 w-full gap-2 rounded-full border-bone/15 text-bone hover:border-scope/60 hover:text-scope-bright",
                  )}
                >
                  <Download className="h-4 w-4" /> Resume
                </a>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/**
 * The logo lockup, drawn rather than set: a detection box closing on two
 * letters, which is the same bounding-box motif the site uses everywhere and
 * the thing the flagship model literally does. The corner brackets open
 * outward on hover, the way a reticle acquires a target.
 */
function Monogram() {
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center">
      <span
        aria-hidden
        className="absolute inset-1 rounded-full bg-scope/25 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100"
      />
      <svg viewBox="0 0 40 40" aria-hidden className="absolute inset-0 h-full w-full text-scope">
        <rect x="7" y="7" width="26" height="26" rx="1.5" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.28" />
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="square"
          className="origin-center transition-transform duration-500 ease-out group-hover:scale-[1.14]"
        >
          <path d="M2.5 10.5 V2.5 H10.5" />
          <path d="M29.5 2.5 H37.5 V10.5" />
          <path d="M37.5 29.5 V37.5 H29.5" />
          <path d="M10.5 37.5 H2.5 V29.5" />
        </g>
        <g stroke="currentColor" strokeWidth="0.8" opacity="0.45">
          <line x1="20" y1="1.5" x2="20" y2="5" />
          <line x1="20" y1="35" x2="20" y2="38.5" />
          <line x1="1.5" y1="20" x2="5" y2="20" />
          <line x1="35" y1="20" x2="38.5" y2="20" />
        </g>
      </svg>
      <span className="relative font-display text-[0.8rem] font-semibold tracking-[0.04em] text-bone">AT</span>
    </span>
  );
}
