import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Github, Linkedin, Phone, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { InstrumentField } from "@/components/ui/InstrumentField";
import { TiltCard } from "@/components/ui/TiltCard";
import { HeadingChip } from "@/components/ui/SectionHeading";
import { resolveResumeUrl, safeExternalUrl } from "@/lib/urls";
import type { Profile } from "@/types";

interface Channel {
  key: string;
  icon: LucideIcon;
  label: string;
  /** The destination in plain sight, so a click is never a leap of faith. */
  meta: string;
  href: string;
  external: boolean;
  ariaLabel: string;
  title: string;
}

/** Written out in full because Tailwind reads class names statically - a
 *  string built at runtime would never reach the generated stylesheet. */
const CHANNEL_COLUMNS = [
  "",
  "sm:grid-cols-2",
  "sm:grid-cols-2",
  "sm:grid-cols-2 lg:grid-cols-3",
  "sm:grid-cols-2 lg:grid-cols-4",
];

/** `github.com/anirudh` rather than the whole URL. A handle is the part a
 *  recruiter actually reads, and showing it proves the link goes where the
 *  label claims before anyone commits to a click. */
function linkHandle(url: string): string {
  try {
    const { host, pathname } = new URL(url);
    const domain = host.replace(/^www\./, "");
    const path = pathname.replace(/^\/+|\/+$/g, "");
    return path ? `${domain}/${path}` : domain;
  } catch {
    return url;
  }
}

export function Footer({ profile }: { profile?: Profile }) {
  const reduced = useReducedMotion();
  const year = new Date().getFullYear();
  const email = profile?.email?.trim();
  const githubUrl = safeExternalUrl(profile?.github_url);
  const linkedinUrl = safeExternalUrl(profile?.linkedin_url);
  const resumeUrl = resolveResumeUrl(profile?.resume_url);
  const phone = profile?.phone?.trim();
  const phoneHref = phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : null;

  const channels: Channel[] = [];
  if (githubUrl) {
    channels.push({
      key: "github",
      icon: Github,
      label: "GitHub",
      meta: linkHandle(githubUrl),
      href: githubUrl,
      external: true,
      ariaLabel: "GitHub",
      title: "Open GitHub",
    });
  }
  if (linkedinUrl) {
    channels.push({
      key: "linkedin",
      icon: Linkedin,
      label: "LinkedIn",
      meta: linkHandle(linkedinUrl),
      href: linkedinUrl,
      external: true,
      ariaLabel: "LinkedIn",
      title: "Open LinkedIn",
    });
  }
  if (phoneHref && phone) {
    channels.push({
      key: "phone",
      icon: Phone,
      label: "Phone",
      meta: phone,
      href: phoneHref,
      external: false,
      ariaLabel: `Call ${phone}`,
      title: `Call ${phone}`,
    });
  }
  if (resumeUrl) {
    channels.push({
      key: "resume",
      icon: FileText,
      label: "Resume",
      meta: "PDF",
      href: resumeUrl,
      external: true,
      ariaLabel: "Resume",
      title: "Open resume",
    });
  }

  // Every affordance in this section is gated on one of these. With the
  // profile's contact fields all blank, the navbar's "Contact" link used to
  // land the visitor on a panel with nothing in it but a heading.
  const hasContactMethod = Boolean(email || channels.length > 0);
  // The row has to fit whatever the owner has filled in. A fixed four-column
  // grid left an obvious hole on the right whenever one of the four was
  // blank, which is the normal case.
  const channelColumns = CHANNEL_COLUMNS[Math.min(channels.length, 4)];

  return (
    <footer
      id="contact"
      className="relative scroll-mt-24 overflow-hidden border-t border-ink-700 px-6 pb-10 pt-24 sm:px-10 sm:pt-28"
    >
      <InstrumentField className="opacity-[0.5]" />
      <div className="pointer-events-none absolute -left-40 top-0 h-[28rem] w-[28rem] bloom [--bloom:color-mix(in_srgb,var(--color-scope)_11.2%,transparent)]" />
      {/* One drifting bloom only. The page closes here, so the last thing in
          view should settle rather than keep performing. */}
      <motion.div
        aria-hidden
        animate={reduced ? undefined : { x: [0, 36, 0], y: [0, -18, 0] }}
        transition={reduced ? undefined : { duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-32 bottom-10 h-[24rem] w-[24rem] bloom [--bloom:color-mix(in_srgb,var(--color-signal)_8.0%,transparent)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {/* The closing header deliberately carries no index number: the
                numbered run belongs to the sections of the page, and this is
                the sign-off rather than another one of them. */}
            <div className="flex items-center gap-3">
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="h-px w-14 origin-left bg-scope/70"
              />
              <span className="font-mono text-xs tracking-[0.2em] text-bone-faint">CONTACT</span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 font-display text-[2.4rem] font-semibold leading-[0.98] tracking-[-0.035em] text-bone sm:text-[3.4rem] lg:text-[4.1rem]"
            >
              Let&rsquo;s build something
              <br />
              <span className="text-bone-faint">worth deploying.</span>
            </motion.h2>

            <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-bone-dim">
              Always glad to talk about computer vision, LLM systems, or the engineering that puts a model in front
              of real users.
            </p>
          </div>

          <div className="shrink-0 sm:pb-3">
            <HeadingChip>OPEN TO CONNECT</HeadingChip>
          </div>
        </div>

        {/* The email is the one action this page is asking for, so it gets a
            plate of its own rather than a place in a row of small grey icons. */}
        {email ? (
          <motion.a
            href={`mailto:${email}`}
            aria-label={`Email ${email}`}
            title="Send an email"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="group relative mt-12 block rounded-[1.75rem]"
          >
            {/* The whole plate is one link, so the tilt wraps its inside rather
                than the anchor - a transformed anchor still takes the click,
                but nesting keeps the hit area and the surface separate. */}
            <TiltCard strength={6} glare>
            <span className="relative block overflow-hidden rounded-[1.75rem] border border-bone/[0.1] bg-ink-900/75 p-6 transition-colors duration-300 group-hover:border-scope/45 sm:p-9">
            <span className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-scope/15 opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
            {/* Brackets close on the plate on hover - the same acquisition
                gesture the vision work performs on a frame. */}
            {[
              "left-4 top-4 border-l border-t",
              "right-4 top-4 border-r border-t",
              "left-4 bottom-4 border-b border-l",
              "right-4 bottom-4 border-b border-r",
            ].map((corner) => (
              <span
                key={corner}
                aria-hidden
                className={`pointer-events-none absolute h-4 w-4 border-scope/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${corner}`}
              />
            ))}

            {/* On a phone the address needs the full width of the plate to
                avoid breaking mid-word, so the action moves to its own row
                underneath and takes a label with it. */}
            <span className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
              <span className="min-w-0">
                <span className="block font-mono text-[0.62rem] tracking-[0.2em] text-bone-faint">
                  PRIMARY CHANNEL
                </span>
                <span className="mt-3 block break-words font-display text-[1.1rem] font-medium leading-[1.12] tracking-[-0.02em] text-bone transition-colors duration-300 group-hover:text-scope-bright sm:text-[2.2rem] sm:leading-[1.05] lg:text-[2.75rem]">
                  {email}
                </span>
              </span>
              <span className="flex items-center justify-between gap-4">
                <span className="font-mono text-[0.6rem] tracking-[0.2em] text-bone-faint sm:hidden">
                  SEND AN EMAIL
                </span>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-bone/15 text-bone-dim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-scope/50 group-hover:text-scope-bright sm:h-14 sm:w-14">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </span>
            </span>
            </span>
            </TiltCard>
          </motion.a>
        ) : (
          <div className="relative mt-12 overflow-hidden rounded-[1.75rem] border border-bone/[0.1] bg-ink-900/75 p-6 sm:p-9">
            <span className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-scope/15 blur-3xl" />
            <span className="relative block font-mono text-[0.62rem] tracking-[0.2em] text-bone-faint">
              PRIMARY CHANNEL
            </span>
            <p className="relative mt-3 font-display text-[1.75rem] font-medium tracking-[-0.02em] text-bone sm:text-[2.75rem]">
              Let&rsquo;s talk
            </p>
            {!hasContactMethod && (
              <p className="relative mt-4 max-w-md font-body text-sm text-bone-dim">
                Contact details are being updated right now — please check back shortly.
              </p>
            )}
          </div>
        )}

        {channels.length > 0 && (
          <div className={`mt-3 grid gap-3 ${channelColumns}`}>
            {channels.map(({ key, icon: Icon, label, meta, href, external, ariaLabel, title }, i) => (
              <motion.a
                key={key}
                href={href}
                aria-label={ariaLabel}
                title={title}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: reduced ? 0 : i * 0.06, ease: "easeOut" }}
                className="group relative block rounded-2xl"
              >
                <TiltCard strength={6} glare>
                <span className="relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-bone/[0.08] bg-ink-900/75 p-4 transition-colors duration-300 group-hover:border-scope/40">
                <span className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-scope/15 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-scope/25 bg-scope/[0.07] text-scope-bright">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="relative min-w-0">
                  <span className="block font-display text-sm tracking-[0.01em] text-bone">{label}</span>
                  <span className="mt-0.5 block truncate font-mono text-[0.62rem] tracking-[0.08em] text-bone-faint">
                    {meta}
                  </span>
                </span>
                <ArrowUpRight className="relative ml-auto h-4 w-4 shrink-0 text-bone-faint transition-colors duration-300 group-hover:text-scope-bright" />
                </span>
                </TiltCard>
              </motion.a>
            ))}
          </div>
        )}

        <CalibrationRule />

        <div className="flex flex-col gap-3 font-mono text-[0.65rem] tracking-[0.12em] text-bone-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {profile?.name || "Anirudh Tirumala"}
            {profile?.location ? <span className="text-ink-500"> · {profile.location}</span> : null}
          </p>
          <Link to="/login" className="transition-colors hover:text-bone-dim">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}

/**
 * The last mark on the page: a measurement rule with one lit division, which
 * closes the instrument language the rest of the site is drawn in. The strokes
 * keep their width while the ruler stretches, so the ticks stay hairlines at
 * any viewport instead of fattening on a wide screen.
 */
function CalibrationRule() {
  return (
    <div aria-hidden className="relative mt-16 h-8 w-full sm:mt-20">
      <svg className="h-full w-full text-scope" viewBox="0 0 1200 32" preserveAspectRatio="none">
        <defs>
          <linearGradient id="footer-rule-fade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="18%" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="82%" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="16" x2="1200" y2="16" stroke="url(#footer-rule-fade)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {Array.from({ length: 49 }, (_, i) => {
          const x = i * 25;
          const major = i % 6 === 0;
          return (
            <line
              key={i}
              x1={x}
              y1={16}
              x2={x}
              y2={major ? 28 : 22}
              stroke="currentColor"
              strokeWidth="1"
              opacity={major ? 0.4 : 0.18}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        <line x1="0" y1="16" x2="0" y2="4" stroke="currentColor" strokeWidth="1.5" opacity="0.8" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
