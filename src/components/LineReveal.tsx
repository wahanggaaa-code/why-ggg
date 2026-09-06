import { motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";

type Props = {
  lines: string[];
  className?: string;
  delay?: number;
  stagger?: number;
  trigger?: "mount" | "viewport";
  once?: boolean;
};

/** Reveal teks per-baris (setiap baris ter-clipping dari bawah) — untuk statement besar. */
export function LineReveal({
  lines,
  className,
  delay = 0,
  stagger = 0.14,
  trigger = "viewport",
  once = true,
}: Props) {
  const reduce = useReducedMotion();

  const parent: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const child: Variants = {
    hidden: { y: reduce ? 0 : "112%", opacity: reduce ? 1 : 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 1, ease: [0.65, 0, 0.35, 1] },
    },
  };

  const bind =
    trigger === "viewport"
      ? { initial: "hidden" as const, whileInView: "visible" as const, viewport: { once, margin: "-12% 0px" } }
      : { initial: "hidden" as const, animate: "visible" as const };

  return (
    <motion.span className={className} variants={parent} {...bind}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <motion.span className="block will-change-transform" variants={child}>
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
