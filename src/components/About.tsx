import { motion } from "motion/react";
import { site } from "../content/site";
import { Counter } from "./Counter";
import { LineReveal } from "./LineReveal";
import { SectionLabel } from "./SectionLabel";

export function About() {
  return (
    <section
      id="tentang"
      className="flex min-h-[100svh] flex-col justify-center px-5 py-24 md:px-10"
    >
      <div className="flex items-baseline justify-between">
        <SectionLabel>{site.about.label}</SectionLabel>
        <SectionLabel className="hidden md:block">{site.about.index}</SectionLabel>
      </div>

      <h2 className="mt-10 font-display text-[clamp(1.7rem,4.2vw,3.6rem)] font-medium leading-[1.15] tracking-[-0.02em]">
        <LineReveal lines={site.about.lines} />
      </h2>

      <div className="mt-20 grid grid-cols-1 gap-10 border-t border-line pt-10 sm:grid-cols-3">
        {site.about.stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-2"
          >
            <span className="font-display text-5xl font-semibold md:text-6xl">
              {s.value != null ? <Counter to={s.value} suffix={s.suffix} /> : s.display}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
