import { Link } from "react-router-dom";
import { Github, Linkedin, Mail, Phone } from "lucide-react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TiltCard } from "@/components/ui/TiltCard";
import { safeExternalUrl } from "@/lib/urls";
import type { Profile } from "@/types";

export function Footer({ profile }: { profile?: Profile }) {
  const reduced = useReducedMotion();
  const year = new Date().getFullYear();
  const githubUrl = safeExternalUrl(profile?.github_url);
  const linkedinUrl = safeExternalUrl(profile?.linkedin_url);
  const phone = profile?.phone?.trim();
  const phoneHref = phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : null;

  return (
    <footer id="contact" className="section-aura relative overflow-hidden border-t border-ink-700 px-6 py-16 sm:px-10">
      {/* Soft drifting glow behind the sign-off line - a quiet close to the
          floating motif used throughout the page, not a repeat of it. */}
      <motion.div
        aria-hidden
        animate={reduced ? undefined : { x: [0, 40, 0], y: [0, -20, 0] }}
        transition={reduced ? undefined : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-1/4 top-0 h-64 w-64 rounded-full bg-scope/10 blur-[100px]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            animate={reduced ? undefined : { y: [0, -7, 0] }}
            transition={reduced ? undefined : { duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-full max-w-3xl"
          >
            <TiltCard strength={3.5} glare>
              <div className="glass-panel relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8">
                <span className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-scope/25 blur-3xl animate-drift" />
                <span className="relative block font-display text-sm text-bone-dim">Say hello</span>
                {profile?.email ? (
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-gradient-spectrum relative mt-2 block break-all font-display text-3xl transition-transform duration-300 hover:translate-x-1 sm:text-5xl"
                  >
                    {profile.email}
                  </a>
                ) : (
                  <p className="text-gradient-spectrum relative mt-2 font-display text-3xl sm:text-5xl">Let's talk</p>
                )}
                <div className="relative mt-5 flex flex-wrap gap-3">
                  {profile?.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="inline-flex items-center gap-2 rounded-full border border-bone/15 px-3 py-2 font-display text-xs text-bone-dim transition-all hover:-translate-y-0.5 hover:border-scope/60 hover:text-scope-bright"
                    >
                      <Mail className="h-3.5 w-3.5" /> Email me
                    </a>
                  )}
                  {phoneHref && (
                    <a
                      href={phoneHref}
                      className="inline-flex items-center gap-2 rounded-full border border-bone/15 px-3 py-2 font-display text-xs text-bone-dim transition-all hover:-translate-y-0.5 hover:border-scope/60 hover:text-scope-bright"
                    >
                      <Phone className="h-3.5 w-3.5" /> {phone}
                    </a>
                  )}
                </div>
                <span className="relative mt-5 flex items-center gap-2 font-display text-[0.65rem] tracking-[0.16em] text-bone-faint">
                  <span className="h-2 w-2 rounded-full bg-signal animate-pulse-soft" /> OPEN TO CONNECT
                </span>
              </div>
            </TiltCard>
          </motion.div>

          <div className="flex items-center gap-3">
            {githubUrl && (
              <motion.a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                whileHover={reduced ? undefined : { y: -3, rotate: -6, scale: 1.1 }}
                title="Open GitHub"
                className="inline-flex items-center gap-2 rounded-full border border-ink-700 px-3 py-2 font-display text-xs text-bone-dim transition-all hover:-translate-y-0.5 hover:border-scope/60 hover:text-scope"
              >
                <Github className="h-4 w-4" /> GitHub
              </motion.a>
            )}
            {linkedinUrl && (
              <motion.a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                whileHover={reduced ? undefined : { y: -3, rotate: 6, scale: 1.1 }}
                title="Open LinkedIn"
                className="inline-flex items-center gap-2 rounded-full border border-ink-700 px-3 py-2 font-display text-xs text-bone-dim transition-all hover:-translate-y-0.5 hover:border-scope/60 hover:text-scope"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn
              </motion.a>
            )}
            {profile?.email && (
              <motion.a
                href={`mailto:${profile.email}`}
                aria-label="Email"
                whileHover={reduced ? undefined : { y: -3, rotate: -6, scale: 1.1 }}
                title="Send an email"
                className="inline-flex items-center gap-2 rounded-full border border-ink-700 px-3 py-2 font-display text-xs text-bone-dim transition-all hover:-translate-y-0.5 hover:border-scope/60 hover:text-scope"
              >
                <Mail className="h-4 w-4" /> Mail
              </motion.a>
            )}
            {phoneHref && (
              <motion.a
                href={phoneHref}
                aria-label={`Call ${phone}`}
                title={`Call ${phone}`}
                whileHover={reduced ? undefined : { y: -3, rotate: 4, scale: 1.05 }}
                className="inline-flex items-center gap-2 rounded-full border border-ink-700 px-3 py-2 font-display text-xs text-bone-dim transition-all hover:-translate-y-0.5 hover:border-scope/60 hover:text-scope"
              >
                <Phone className="h-4 w-4" /> Call
              </motion.a>
            )}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 text-xs text-bone-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {profile?.name || "Anirudh Tirumala"}. {profile?.location}
          </p>
          <Link to="/login" className="transition-colors hover:text-bone-dim">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
