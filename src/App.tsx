import { useReducedMotion } from "motion/react";
import Lenis from "lenis";
import { useEffect, useState } from "react";
import { About } from "./components/About";
import { Capabilities } from "./components/Capabilities";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Manifesto } from "./components/Manifesto";
import { Marquee } from "./components/Marquee";
import { Preloader } from "./components/Preloader";
import { Timeline } from "./components/Timeline";
import { Work } from "./components/Work";
import { getLenis, setLenis } from "./lib/scroll";

export default function App() {
  const reduce = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [preloaderGone, setPreloaderGone] = useState(false);

  // Smooth scroll (Lenis) — nonaktif kalau user prefer reduced motion
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.1 });
    setLenis(lenis);
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      setLenis(null);
    };
  }, [reduce]);

  // Kunci scroll selama preloader berjalan
  useEffect(() => {
    const lenis = getLenis();
    if (!revealed) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [revealed]);

  return (
    <div className="relative">
      {!preloaderGone && (
        <Preloader
          onReveal={() => setRevealed(true)}
          onDone={() => setPreloaderGone(true)}
        />
      )}

      {revealed && (
        <>
          <Header />
          <main>
            <Hero />
            <Marquee />
            <About />
            <Manifesto />
            <Work />
            <Capabilities />
            <Timeline />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}
