import { motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";

type Props = {
  text: string;
  className?: string;
  /** Delay awal (detik) sebelum word pertama muncul. */
  delay?: number;
  /** Jeda antar word (detik). */
  stagger?: number;
  /** "mount" = animasi begitu component render, "viewport" = saat masuk viewport. */
  trigger?: "mount" | "viewport";
  once?: boolean;
};

/** Reveal teks per-word dengan clip overflow — gaya studio (hellohello/lamalama). */
export function RevealText({
  text,
  className,
  delay = 0,
  stagger = 0.035,
  trigger = "viewport",
  once = true,
}: Props) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  const parent: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const child: Variants = {
    hidden: { y: reduce ? 0 : "112%", opacity: reduce ? 1 : 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] },
    },
  };

  const bind =
    trigger === "viewport"
      ? { initial: "hidden" as const, whileInView: "visible" as const, viewport: { once, margin: "-12% 0px" } }
      : { initial: "hidden" as const, animate: "visible" as const };

  return (
    <motion.span className={className} variants={parent} {...bind} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
          <motion.span aria-hidden="true" className="inline-block will-change-transform" variants={child}>
            {word + (i < words.length - 1 ? "\u00A0" : "")}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
