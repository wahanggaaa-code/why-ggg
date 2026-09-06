import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { site } from "../content/site";
import { LineReveal } from "./LineReveal";
import { SectionLabel } from "./SectionLabel";

/** Statement besar di tengah layar — parallax lembut. */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 py-24 text-center md:px-10"
    >
      <motion.div
        aria-hidden
        style={reduce ? undefined : { y }}
        className="pointer-events-none absolute -bottom-[25%] -left-[10%] h-[60vw] w-[60vw] rounded-full bg-accent/[0.07] blur-[140px]"
      />
      <SectionLabel className="relative">{site.manifesto.label}</SectionLabel>
      <p className="relative mt-8 font-display text-[clamp(2.2rem,6.5vw,6rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
        <LineReveal lines={site.manifesto.lines} stagger={0.16} />
      </p>
    </section>
  );
}
