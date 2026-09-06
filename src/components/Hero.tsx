import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { site } from "../content/site";
import { RevealText } from "./RevealText";
import { SectionLabel } from "./SectionLabel";

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const videoY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-5 pt-28 pb-8 md:px-10"
    >
      {/* Glow background — parallax */}
      <motion.div
        aria-hidden
        style={reduce ? undefined : { y: glowY }}
        className="pointer-events-none absolute -top-[20%] -right-[10%] h-[70vw] w-[70vw] rounded-full bg-accent/10 blur-[140px]"
      />

      <div className="relative flex flex-1 flex-col justify-end">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionLabel>{site.hero.label}</SectionLabel>
        </motion.div>

        {/* Headline besar — word-by-word reveal */}
        <h1 className="mt-6 font-display text-[clamp(2.6rem,9.5vw,9rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
          {site.hero.lines.map((line, i) => (
            <RevealText
              key={i}
              text={line}
              className="block"
              trigger="mount"
              delay={0.55 + i * 0.13}
              stagger={0.03}
            />
          ))}
        </h1>

        {/* Video kecil di hero + kontrol (gaya lamalama) */}
        <motion.div
          style={reduce ? undefined : { y: videoY }}
          className="mt-10 flex flex-col items-end gap-3"
        >
          <div className="w-[min(440px,84vw)] overflow-hidden rounded-xl border border-line bg-panel md:w-[min(520px,52vw)]">
            <video
              ref={videoRef}
              src={site.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="aspect-video w-full object-cover"
            />
          </div>
          <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
            <button
              onClick={togglePlay}
              className="cursor-pointer transition-colors hover:text-paper"
              aria-label={playing ? "Jeda video" : "Putar video"}
            >
              {playing ? "▮▮ Jeda" : "▶ Putar"}
            </button>
            <span className="text-line">/</span>
            <span className="text-mute/70">Mute</span>
          </div>
        </motion.div>
      </div>

      {/* Baris bawah: scroll hint + socials */}
      <div className="relative mt-14 flex items-end justify-between border-t border-line pt-5 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
        <span className="flex items-center gap-3">
          {site.hero.scrollHint}
          <span className="inline-block animate-bob motion-reduce:animate-none">↓</span>
        </span>
        <div className="hidden gap-6 sm:flex">
          {site.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-paper"
            >
              {s.label} ↗
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
