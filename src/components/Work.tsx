import { motion, useReducedMotion } from "motion/react";
import { site } from "../content/site";
import { SectionLabel } from "./SectionLabel";

export function Work() {
  const reduce = useReducedMotion();

  return (
    <section
      id="karya"
      className="flex min-h-[100svh] flex-col justify-center px-5 py-24 md:px-10"
    >
      <div className="flex items-baseline justify-between">
        <SectionLabel>{site.work.label}</SectionLabel>
        <SectionLabel className="hidden md:block">{site.work.count}</SectionLabel>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
        {site.work.projects.map((p, i) => (
          <motion.a
            key={p.id}
            href="#karya"
            onClick={(e) => e.preventDefault()}
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.9, delay: (i % 2) * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="group relative block overflow-hidden rounded-xl border border-line"
            aria-label={`${p.title} — ${p.tag}`}
          >
            <div
              className={`aspect-[4/3] w-full bg-gradient-to-br ${p.gradient} transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]`}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

            <div className="absolute top-4 left-5 font-mono text-[11px] tracking-[0.2em] text-paper/70 md:top-6 md:left-7">
              ({p.id})
            </div>
            <div className="absolute top-4 right-5 font-mono text-[11px] tracking-[0.2em] text-paper/70 md:top-6 md:right-7">
              {p.year}
            </div>

            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between md:inset-x-7 md:bottom-7">
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-tight md:text-4xl">
                  {p.title}
                </h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/60 md:text-[11px]">
                  {p.tag}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-paper/30 text-paper transition-all duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent/20 md:h-12 md:w-12">
                ↗
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
