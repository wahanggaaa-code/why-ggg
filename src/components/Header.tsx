import { motion, useReducedMotion } from "motion/react";
import { site } from "../content/site";
import { useClock } from "../hooks/useClock";
import { scrollToTarget } from "../lib/scroll";

const links = [
  { label: "Tentang", href: "#tentang" },
  { label: "Karya", href: "#karya" },
  { label: "Keahlian", href: "#keahlian" },
  { label: "Perjalanan", href: "#perjalanan" },
  { label: "Kontak", href: "#kontak" },
];

export function Header() {
  const time = useClock();
  const reduce = useReducedMotion();

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToTarget(href);
  };

  return (
    <motion.header
      initial={reduce ? false : { y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-5 mix-blend-difference md:h-16 md:px-10"
    >
      <a
        href="#top"
        onClick={go("#top")}
        className="font-mono text-xs tracking-[0.18em] uppercase md:text-sm"
      >
        {site.handle}
      </a>

      <nav className="hidden items-center gap-8 md:flex">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={go(l.href)}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/70 transition-colors hover:text-paper"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <span className="font-mono text-[11px] tracking-[0.18em] text-paper/70 tabular-nums">
        {time} WIB
      </span>
    </motion.header>
  );
}
