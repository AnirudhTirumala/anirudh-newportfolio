import { useState, type ReactNode } from "react";
import {
  Award,
  ExternalLink,
  GraduationCap,
  Languages as LanguagesIcon,
  MapPin,
  Maximize2,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { InstrumentField } from "@/components/ui/InstrumentField";
import { TiltCard } from "@/components/ui/TiltCard";
import { SectionHeading, HeadingChip } from "@/components/ui/SectionHeading";
import { resolveUploadUrl } from "@/api/client";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { safeExternalUrl } from "@/lib/urls";
import type { Certificate, Education, Language } from "@/types";

interface Props {
  education?: Education[];
  certificates?: Certificate[];
  languages?: Language[];
}

/** The opener for each of the three record groups. Education, certificates and
 *  languages are different kinds of thing, and three identical stacks of text
 *  gave a visitor no way to tell them apart at a glance. */
function GroupLabel({
  icon: Icon,
  children,
  count,
  accent = "scope",
}: {
  icon: LucideIcon;
  children: ReactNode;
  count: number;
  accent?: "scope" | "signal";
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
          accent === "signal"
            ? "border-signal/30 bg-signal/10 text-signal-bright"
            : "border-scope/30 bg-scope/10 text-scope-bright",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="font-mono text-[0.66rem] tracking-[0.2em] text-bone-faint">{children}</span>
      <span className="h-px flex-1 bg-bone/[0.08]" />
      <span className="font-mono text-[0.62rem] tracking-[0.14em] text-bone-faint">
        {String(count).padStart(2, "0")}
      </span>
    </div>
  );
}

/** A two-letter tag for the language chip. It is derived, not stored, so it
 *  stays correct for whatever the owner adds later. */
function languageTag(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

function CertificateCard({
  certificate,
  index,
  reduced,
  onOpen,
}: {
  certificate: Certificate;
  index: number;
  reduced: boolean;
  onOpen: (certificate: Certificate) => void;
}) {
  // `cert.url` is the one API-supplied link on the public site that used to
  // reach an `href` unsanitised, and an `image_url` the API cannot serve
  // resolves to an empty string - which would open the lightbox on
  // `<img src="">`, i.e. a request for this page.
  const certUrl = safeExternalUrl(certificate.url);
  const imageUrl = resolveUploadUrl(certificate.image_url);
  // Certificate files live on the API host's own disk, so they go missing
  // whenever it restarts. The card keeps its shape and stays clickable; the
  // lightbox explains what happened.
  const [previewFailed, setPreviewFailed] = useState(false);

  return (
    <motion.li
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl"
    >
      {/* A certificate is a physical artefact, so it gets the strongest tilt
          on the page - it should feel like a card being turned to the light. */}
      <TiltCard strength={7} glare>
      <div className="relative overflow-hidden rounded-2xl border border-bone/[0.08] bg-ink-900/75 transition-colors duration-300 group-hover:border-scope/40">
      {imageUrl ? (
        <>
          <button
            type="button"
            onClick={() => onOpen(certificate)}
            // The button wraps a plate, a title and an issuer, so the name is
            // stated rather than assembled from everything inside it.
            aria-label={`View the ${certificate.name} certificate`}
            className="block w-full text-left"
          >
            {/* The certificate is treated as the artefact it is: a framed
                plate with a detection-style bracket around it, which is the
                same motif the vision work produces. */}
            <span className="relative block aspect-[4/3] overflow-hidden border-b border-bone/[0.07] bg-ink-1000/70">
              {previewFailed ? (
                <span className="grid h-full w-full place-items-center text-scope-dim">
                  <Award className="h-8 w-8" aria-hidden="true" />
                </span>
              ) : (
                <img
                  src={imageUrl}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  onError={() => setPreviewFailed(true)}
                  // Certificate scans are near-white, so they are held back
                  // until hover - two lit plates would otherwise be the
                  // brightest thing on a deliberately dark page.
                  className="h-full w-full object-cover opacity-[0.68] transition duration-500 group-hover:scale-[1.02] group-hover:opacity-100"
                />
              )}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-1000/80 via-ink-1000/10 to-transparent" />
              <span className="pointer-events-none absolute inset-3 border border-scope/0 transition-colors duration-500 group-hover:border-scope/25" />
              <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-scope/40 transition-colors duration-500 group-hover:border-scope" />
              {/* The verify link takes this corner when there is one, so the
                  bracket steps aside rather than sitting under it. */}
              {!certUrl && (
                <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-scope/40 transition-colors duration-500 group-hover:border-scope" />
              )}
              <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-scope/40 transition-colors duration-500 group-hover:border-scope" />
              <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-scope/40 transition-colors duration-500 group-hover:border-scope" />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-bone/12 bg-ink-1000/80 px-2.5 py-1 font-mono text-[0.58rem] tracking-[0.16em] text-bone-dim opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100"
              >
                <Maximize2 className="h-3 w-3" aria-hidden="true" /> VIEW
              </span>
            </span>
            <span className="block px-4 py-4">
              <span className="block font-display text-[0.95rem] leading-snug text-bone transition-colors duration-300 group-hover:text-scope-bright">
                {certificate.name}
              </span>
              {certificate.issuer && (
                <span className="mt-1.5 block font-mono text-[0.64rem] tracking-[0.1em] text-bone-faint">
                  {certificate.issuer}
                </span>
              )}
            </span>
          </button>

          {/* Kept as its own control, outside the button that opens the
              lightbox, so verifying externally never means opening the image
              first. */}
          {certUrl && (
            <a
              href={certUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Verify ${certificate.name} externally`}
              title="Verify externally"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg border border-bone/12 bg-ink-1000/80 text-bone-faint transition-colors hover:border-scope/45 hover:text-scope"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </>
      ) : (
        <div className="flex items-start gap-3 px-4 py-4">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-scope/25 bg-scope/10 text-scope-bright">
            <Award className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            {certUrl ? (
              <a
                href={certUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-1.5 font-display text-[0.95rem] leading-snug text-bone transition-colors hover:text-scope"
              >
                {certificate.name}
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </a>
            ) : (
              <p className="font-display text-[0.95rem] leading-snug text-bone">{certificate.name}</p>
            )}
            {certificate.issuer && (
              <p className="mt-1.5 font-mono text-[0.64rem] tracking-[0.1em] text-bone-faint">
                {certificate.issuer}
              </p>
            )}
          </div>
        </div>
      )}
      </div>
      </TiltCard>
    </motion.li>
  );
}

export function Credentials({ education, certificates, languages }: Props) {
  const reduced = useReducedMotion();
  const [lightboxCert, setLightboxCert] = useState<Certificate | null>(null);
  const hasContent = (education?.length ?? 0) + (certificates?.length ?? 0) + (languages?.length ?? 0) > 0;
  if (!hasContent) return null;

  return (
    <>
      <section className="relative overflow-hidden border-t border-ink-700/60 px-6 py-28 sm:px-10">
        <InstrumentField className="opacity-[0.5]" />
        <div className="pointer-events-none absolute -right-44 top-16 h-[30rem] w-[30rem] bloom [--bloom:color-mix(in_srgb,var(--color-scope)_8.8%,transparent)]" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[24rem] w-[24rem] bloom [--bloom:color-mix(in_srgb,var(--color-signal)_5.6%,transparent)]" />

        <div className="relative mx-auto max-w-6xl">
          <SectionHeading
            index="05"
            label="Credentials"
            title="The record behind the work."
            description="Where the training happened, what has been certified, and the languages the work gets done in."
            aside={<HeadingChip>ON FILE</HeadingChip>}
          />

          {/* Twelve columns rather than three equal stacks: the certificates
              carry images and need the wider half, while education and
              languages read as short entries beneath one another. Each group
              keeps its own place when the owner empties another one. */}
          <div className="mt-14 grid items-start gap-x-14 gap-y-12 lg:grid-cols-12">
            {education && education.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: reduced ? 0 : 0.55 }}
                className="lg:col-span-5"
              >
                <GroupLabel icon={GraduationCap} count={education.length}>
                  EDUCATION
                </GroupLabel>
                <div className="mt-6 flex flex-col gap-4">
                  {education.map((entry) => {
                    const years = [entry.start_year, entry.end_year].filter(Boolean).join("–");
                    const degree = [entry.degree, entry.field].filter(Boolean).join(", ");

                    return (
                      <TiltCard key={entry.id} strength={4.5} glare>
                      <article
                        className="group relative overflow-hidden rounded-2xl border border-bone/[0.08] bg-ink-900/75 p-6 transition-colors duration-300 hover:border-scope/35"
                      >
                        <span className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-scope/[0.14] opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="relative flex items-start justify-between gap-4">
                          <h3 className="font-display text-lg leading-snug text-bone">{entry.institution}</h3>
                          {years && (
                            <span className="shrink-0 rounded-full border border-bone/12 bg-ink-1000/50 px-2.5 py-1 font-mono text-[0.62rem] tracking-[0.1em] text-bone-dim">
                              {years}
                            </span>
                          )}
                        </div>
                        {degree && <p className="relative mt-3 font-body text-base text-bone-dim">{degree}</p>}
                        {(entry.location || entry.score) && (
                          <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-bone/[0.07] pt-4 font-mono text-[0.66rem] tracking-[0.12em] text-bone-faint">
                            {entry.location && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-scope-deep" aria-hidden="true" />
                                {entry.location}
                              </span>
                            )}
                            {/* A score is a measurement, so it is set like one. */}
                            {entry.score && <span className="text-scope">{entry.score}</span>}
                          </div>
                        )}
                      </article>
                      </TiltCard>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {certificates && certificates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : 0.08 }}
                className="lg:col-span-7"
              >
                <GroupLabel icon={Award} count={certificates.length}>
                  CERTIFICATES
                </GroupLabel>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {certificates.map((cert, i) => (
                    <CertificateCard
                      key={cert.id}
                      certificate={cert}
                      index={i}
                      reduced={reduced}
                      onOpen={setLightboxCert}
                    />
                  ))}
                </ul>
              </motion.div>
            )}

            {languages && languages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : 0.14 }}
                className="lg:col-span-5"
              >
                {/* Signal rather than scope: the languages here are the same
                    ones the civic assistant answers citizens in. */}
                <GroupLabel icon={LanguagesIcon} count={languages.length} accent="signal">
                  LANGUAGES
                </GroupLabel>
                <ul className="mt-6 flex flex-wrap gap-3">
                  {languages.map((lang) => (
                    <li key={lang.id} className="group rounded-xl">
                      <TiltCard strength={6} glare>
                      <span className="flex items-center gap-3 rounded-xl border border-bone/[0.08] bg-ink-900/75 py-2 pl-2 pr-4 transition-colors duration-300 group-hover:border-signal/35">
                      <span
                        aria-hidden="true"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-signal/25 bg-signal/[0.08] font-mono text-[0.62rem] tracking-[0.06em] text-signal-bright"
                      >
                        {languageTag(lang.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-sm leading-snug text-bone">{lang.name}</span>
                        {lang.proficiency && (
                          <span className="mt-0.5 block font-mono text-[0.6rem] tracking-[0.12em] text-bone-faint">
                            {lang.proficiency}
                          </span>
                        )}
                      </span>
                      </span>
                      </TiltCard>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* The page ends here, so it closes with a mark rather than simply
              stopping. */}
          <div className="mt-16 flex items-center gap-3 font-mono text-[0.66rem] tracking-[0.18em] text-bone-faint">
            <span className="h-px w-10 shrink-0 bg-scope/60" />
            END OF RECORD
            <span className="h-px flex-1 bg-bone/[0.07]" />
          </div>
        </div>
      </section>

      <AnimatePresence>
        {lightboxCert && (
          <ImageLightbox
            src={resolveUploadUrl(lightboxCert.image_url)}
            alt={lightboxCert.name}
            caption={[lightboxCert.name, lightboxCert.issuer].filter(Boolean).join(" · ")}
            onClose={() => setLightboxCert(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
