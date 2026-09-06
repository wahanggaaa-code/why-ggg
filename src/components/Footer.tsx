import { motion, useReducedMotion } from "motion/react";
import { site } from "../content/site";
import { useClock } from "../hooks/useClock";
import { SectionLabel } from "./SectionLabel";

export function Footer() {
  const time = useClock();
  const reduce = useReducedMotion();

  return (
    <footer
      id="kontak"
      className="flex min-h-[100svh] flex-col justify-between px-5 pt-24 pb-8 md:px-10"
    >
      <div>
        <SectionLabel>{site.contact.label}</SectionLabel>
        <a
          href={`mailto:${site.email}`}
          className="group mt-6 inline-flex items-baseline gap-4 md:gap-8"
        >
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(3rem,12vw,11rem)] font-semibold leading-[0.95] tracking-[-0.04em] transition-colors duration-500 group-hover:text-accent"
          >
            {site.contact.cta}
          </motion.span>
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl transition-transform duration-500 group-hover:-translate-y-3 group-hover:translate-x-3 md:text-6xl"
          >
            ↗
          </motion.span>
        </a>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-mute md:mt-8 md:text-base">
          {site.contact.note}
        </p>
      </div>

      <div className="mt-16 flex flex-col gap-6 border-t border-line pt-6">
        <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-[0.2em]">
          {site.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="text-mute transition-colors hover:text-paper"
            >
              {s.label} ↗
            </a>
          ))}
          <a
            href={`mailto:${site.email}`}
            className="text-mute transition-colors hover:text-paper"
          >
            {site.email} ↗
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
          <span>
            © {site.year} {site.handle}
          </span>
          <span className="hidden md:inline">{site.footer.madeWith}</span>
          <span className="tabular-nums">{time} WIB</span>
        </div>
      </div>
    </footer>
  );
}
