import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, Download } from "lucide-react";
import { CornerFrame } from "@/components/ui/CornerFrame";
import { buttonVariants } from "@/components/ui/Button";
import { TiltCard } from "@/components/ui/TiltCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { safeExternalUrl } from "@/lib/urls";
import type { Profile } from "@/types";

const links = [
  { label: "Home", href: "/#top" },
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Experience", href: "/#experience" },
  { label: "Contact", href: "/#contact" },
];

export function Navbar({ profile }: { profile?: Profile }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useReducedMotion();
  const location = useLocation();
  const resumeUrl = safeExternalUrl(profile?.resume_url);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
    if (themeColor) themeColor.content = scrolled || menuOpen ? "#16261d" : "#0b0e0c";
  }, [menuOpen, scrolled]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || menuOpen ? "bg-ink-950/90 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <motion.div
        animate={reduced || menuOpen ? undefined : { y: [0, -2, 0], rotateX: [0, 0.7, 0], rotateY: [-0.7, 0.7, -0.7] }}
        transition={reduced || menuOpen ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
        className="mx-auto w-full max-w-6xl px-6 [perspective:1200px] sm:px-10"
      >
        <TiltCard strength={3.5} glare>
          <div className="flex items-center justify-between py-5">
            <motion.div whileHover={reduced ? undefined : { y: -2, rotate: -4, scale: 1.06 }}>
              <Link to="/#top" aria-label="Anirudh Tirumala — home">
                <CornerFrame color="scope" className="inline-flex h-9 w-9 items-center justify-center">
                  <span className="font-display text-sm font-semibold text-bone">AT</span>
                </CornerFrame>
              </Link>
            </motion.div>

            <nav className="hidden items-center gap-8 sm:flex">
              {links.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  whileHover={reduced ? undefined : { y: -3, rotate: index % 2 === 0 ? -2 : 2, scale: 1.04 }}
                  className="font-display text-sm text-bone-dim transition-colors hover:text-scope"
                >
                  {link.label}
                </motion.a>
              ))}
              {resumeUrl && (
                <motion.a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={reduced ? undefined : { y: -3, rotate: 1.5, scale: 1.04 }}
                  className={buttonVariants("secondary", "sm", "gap-1.5")}
                >
                  <Download className="h-3.5 w-3.5" /> Resume
                </motion.a>
              )}
            </nav>

            <motion.button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              whileHover={reduced ? undefined : { y: -2, rotate: menuOpen ? -8 : 8, scale: 1.08 }}
              className="text-bone sm:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </TiltCard>
      </motion.div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6 border-t border-ink-700 px-6 py-8 sm:hidden"
          >
            {links.map((link) => (
              <a key={link.href} href={link.href} className="font-display text-2xl text-bone">
                {link.label}
              </a>
            ))}
            {resumeUrl && (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants("secondary", "md", "w-fit gap-2")}
              >
                <Download className="h-4 w-4" /> Resume
              </a>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
