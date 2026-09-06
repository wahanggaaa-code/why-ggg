import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "../content/site";
import { useClock } from "../hooks/useClock";

type Phase = "count" | "done";

type Props = {
  /** Dipanggil saat preloader mulai keluar — site di-mount di belakangnya. */
  onReveal: () => void;
  /** Dipanggil setelah animasi keluar selesai — preloader boleh di-unmount. */
  onDone: () => void;
};

/**
 * Preloader gaya hellohello.is:
 * - Layar gelap penuh
 * - Video KECIL di tengah (rounded, loop) — diputar fast-forward hingga 1 loop = 3 detik
 * - Counter besar 00 → 100
 * - Detail mono di 4 sudut
 * - Exit: layar geser ke atas (curtain)
 */
export function Preloader({ onReveal, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("count");
  const [pct, setPct] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const time = useClock();
  const reduce = useReducedMotion();
  const exitRef = useRef<() => void>(() => {});
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  exitRef.current = () => {
    onRevealRef.current(); // site muncul di belakang curtain
    setPhase("done"); // AnimatePresence menjalankan exit (slide up)
  };

  // Urutan: counter 0→100 DAN video sudah playing → exit. Ada safety timeout.
  useEffect(() => {
    let exited = false;
    let countDone = false;
    let videoOk = false;
    let videoFailed = false;
    const v = videoRef.current;

    const tryExit = () => {
      if (exited) return;
      if (countDone && (videoOk || videoFailed)) {
        exited = true;
        exitRef.current();
      }
    };

    const onPlaying = () => {
      videoOk = true;
      tryExit();
    };
    const onError = () => {
      videoFailed = true;
      tryExit();
    };
    v?.addEventListener("playing", onPlaying);
    v?.addEventListener("error", onError);
    // Jika video lambat/blokir, jangan selamanya — keluar paksa.
    const safety = setTimeout(() => {
      videoFailed = true;
      tryExit();
    }, 5000);

    if (reduce) {
      // Reduced motion: counter singkat + fade out
      const controls = animate(0, 100, {
        duration: 0.8,
        ease: "easeOut",
        onUpdate: (val) => setPct(Math.round(val)),
        onComplete: () => {
          countDone = true;
          videoFailed = true;
          tryExit();
        },
      });
      return () => {
        controls.stop();
        clearTimeout(safety);
        v?.removeEventListener("playing", onPlaying);
        v?.removeEventListener("error", onError);
      };
    }

    const controls = animate(0, 100, {
      duration: 2.6,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (val) => setPct(Math.round(val)),
      onComplete: () => {
        countDone = true;
        tryExit();
      },
    });

    return () => {
      controls.stop();
      clearTimeout(safety);
      v?.removeEventListener("playing", onPlaying);
      v?.removeEventListener("error", onError);
    };
  }, [reduce]);

  const exiting = phase === "done";

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!exiting && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-ink p-5 will-change-transform md:p-8"
          exit={
            reduce
              ? { opacity: 0, transition: { duration: 0.4, ease: "easeOut" } }
              : { y: "-100%", transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }
          }
        >
          {/* Baris atas: handle + jam */}
          <div className="flex items-start justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
            <span>{site.handle}</span>
            <span className="tabular-nums">{time} WIB</span>
          </div>

          {/* Tengah: video kecil + counter */}
          <motion.div
            className="flex flex-col items-center gap-5 md:gap-6"
            animate={
              exiting
                ? { scale: reduce ? 1 : 0.92, opacity: reduce ? 1 : 0.35 }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="w-[min(320px,62vw)] overflow-hidden rounded-lg border border-line bg-panel">
              <video
                ref={videoRef}
                src={site.loaderVideoUrl}
                muted
                loop
                autoPlay
                playsInline
                preload="auto"
                className="aspect-video w-full object-cover"
              />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-6xl font-semibold leading-none tracking-tight tabular-nums md:text-7xl">
                {String(pct).padStart(2, "0")}
              </span>
              <span className="font-mono text-xs text-mute">%</span>
            </div>
          </motion.div>

          {/* Baris bawah: lokasi + hak cipta */}
          <div className="flex items-end justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
            <span>{site.location}</span>
            <span>© {site.year}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
