import { useState } from "react";
import { Award, ExternalLink, GraduationCap, Languages as LanguagesIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { TiltCard } from "@/components/ui/TiltCard";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { resolveUploadUrl } from "@/api/client";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Certificate, Education, Language } from "@/types";

interface Props {
  education?: Education[];
  certificates?: Certificate[];
  languages?: Language[];
}

export function Credentials({ education, certificates, languages }: Props) {
  const reduced = useReducedMotion();
  const [lightboxCert, setLightboxCert] = useState<Certificate | null>(null);
  const hasContent = (education?.length ?? 0) + (certificates?.length ?? 0) + (languages?.length ?? 0) > 0;
  if (!hasContent) return null;

  return (
    <>
      <section className="section-aura relative overflow-hidden border-t border-ink-700 px-6 py-28 sm:px-10">
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        whileInView={reduced ? { opacity: 0.04 } : { opacity: 0.04, y: [0, 18, 0] }}
        viewport={{ once: true }}
        transition={reduced ? { duration: 1 } : { opacity: { duration: 1 }, y: { duration: 10, repeat: Infinity, ease: "easeInOut" } }}
        className="pointer-events-none absolute -left-20 top-10 hidden lg:block"
      >
        <GraduationCap className="h-64 w-64 text-scope" strokeWidth={0.5} />
      </motion.div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-16 md:grid-cols-3">
        {education && education.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2"
          >
            <p className="font-display text-sm text-scope">Education</p>
            <div className="mt-7 flex flex-col gap-5">
              {education.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  animate={reduced ? undefined : { y: [0, -7, 0] }}
                  transition={reduced ? undefined : { duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.45 }}
                >
                  <TiltCard strength={4} glare>
                    <div className="glass-panel relative overflow-hidden rounded-[1.5rem] p-6 transition-[border-color,box-shadow] hover:border-scope/55 hover:shadow-scope-glow sm:p-8">
                      <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-scope/20 blur-3xl" />
                      <div className="relative flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-scope/25 bg-scope/10 text-scope-bright">
                              <GraduationCap className="h-4 w-4" />
                            </span>
                            <h3 className="font-display text-lg leading-snug text-bone sm:text-xl">{entry.institution}</h3>
                          </div>
                          <span className="shrink-0 rounded-full border border-bone/10 bg-ink-1000/40 px-2.5 py-1 font-display text-[0.65rem] tracking-[0.1em] text-bone-dim">
                            {entry.start_year}–{entry.end_year}
                          </span>
                        </div>
                        <p className="font-body text-base text-bone-dim">
                          {entry.degree}
                          {entry.field ? `, ${entry.field}` : ""}
                        </p>
                        <p className="font-display text-xs tracking-[0.08em] text-bone-faint">
                          {[entry.location, entry.score].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col gap-16"
        >
          {certificates && certificates.length > 0 && (
            <div>
              <p className="font-display text-sm text-scope">Certificates</p>
              <ul className="mt-8 flex flex-col gap-3">
                {certificates.map((cert, i) => (
                  <motion.li
                    key={cert.id}
                    animate={reduced ? undefined : { y: [0, -5, 0] }}
                    transition={reduced ? undefined : { duration: 5 + (i % 3) * 0.7, repeat: Infinity, ease: "easeInOut", delay: (i % 3) * 0.5 }}
                  >
                    <TiltCard strength={5} glare>
                      <div className="glass-panel flex items-start gap-3 rounded-2xl p-4 transition-[border-color,box-shadow] hover:border-scope/50 hover:shadow-scope-glow">
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-scope" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {cert.image_url ? (
                              <button
                                type="button"
                                onClick={() => setLightboxCert(cert)}
                                className="text-left font-body text-base text-bone underline decoration-ink-600 decoration-dotted underline-offset-4 transition-colors hover:text-scope hover:decoration-scope"
                              >
                                {cert.name}
                              </button>
                            ) : cert.url ? (
                              <a href={cert.url} target="_blank" rel="noreferrer" className="font-body text-base text-bone hover:text-scope">
                                {cert.name}
                              </a>
                            ) : (
                              <p className="font-body text-base text-bone">{cert.name}</p>
                            )}
                            {cert.image_url && cert.url && (
                              <a
                                href={cert.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Verify ${cert.name} externally`}
                                title="Verify externally"
                                className="shrink-0 text-bone-faint transition-colors hover:text-scope"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          {cert.issuer && <p className="font-mono text-xs text-bone-faint">{cert.issuer}</p>}
                        </div>
                      </div>
                    </TiltCard>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {languages && languages.length > 0 && (
            <div>
              <div className="flex items-center gap-2">
                <LanguagesIcon className="h-4 w-4 text-signal" />
                <p className="font-display text-sm text-scope">Languages</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {languages.map((lang, i) => (
                  <motion.div
                    key={lang.id}
                    animate={reduced ? undefined : { y: [0, -6, 0], rotate: [0, i % 2 === 0 ? 1.2 : -1.2, 0] }}
                    transition={reduced ? undefined : { duration: 5 + i * 0.65, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  >
                    <TiltCard strength={6} glare>
                      <div className="glass-panel rounded-2xl px-4 py-3 transition-[border-color,box-shadow] hover:border-signal/50 hover:shadow-[0_18px_45px_-24px_rgba(251,113,133,0.7)]">
                        <p className="font-display text-sm text-bone">{lang.name}</p>
                        {lang.proficiency && <p className="mt-0.5 font-body text-xs text-bone-faint">{lang.proficiency}</p>}
                      </div>
                    </TiltCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
      </section>

      <AnimatePresence>
        {lightboxCert?.image_url && (
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
