import { useEffect, useRef, useState, Fragment } from "react"
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion"
import ScrollWordReveal from "@/components/ui/motion-scroll-word-reveal"

const WR_REST = 0.18
const WR_SPAN = 0.85
const WR_WIN = 0.22
function getWRRange(i, count){
  const s = count<=1?0:(i/(count-1))*WR_SPAN
  return {start:s, end:Math.min(1, s+WR_WIN)}
}
function getWROpacity(p, {start,end}){
  if(p<=start) return WR_REST
  if(p>=end) return 1
  return WR_REST + (1-WR_REST)*((p-start)/(end-start))
}
function RevealWord({children, progress, index, count, reducedMotion}){
  const range = getWRRange(index, count)
  const opacity = useTransform(progress, v => getWROpacity(v, range))
  return <motion.span aria-hidden style={reducedMotion?undefined:{opacity}} className="inline-block will-change-[opacity]">{children}</motion.span>
}
function RevealWorkTitle({ text, boldIndices=[] }){
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.88","start 0.42"] })
  const words = text.split(" ")
  return (
    <div ref={ref} className="font-sans font-semibold text-[clamp(24px,3vw,42px)] tracking-[-0.04em] leading-[0.95] text-fg flex flex-wrap gap-x-[0.22em]" aria-label={text}>
      <span className="sr-only">{text}</span>
      {words.map((w,i)=>(
        <Fragment key={`${w}-${i}`}>
          <RevealWord progress={scrollYProgress} index={i} count={words.length} reducedMotion={!!reduced}>
            <span className={boldIndices.includes(i) ? "font-bold" : ""}>{w}</span>
          </RevealWord>
          {i < words.length-1 ? " " : null}
        </Fragment>
      ))}
    </div>
  )
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [videoVisible, setVideoVisible] = useState(true)
  const videoRef = useRef(null)

  useEffect(() => {
    const t1 = setTimeout(() => setVideoVisible(false), 3000)
    const t2 = setTimeout(() => setIsLoading(false), 3700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const replay = () => {
    setVideoVisible(true)
    setIsLoading(true)
    setTimeout(() => setVideoVisible(false), 3000)
    setTimeout(() => setIsLoading(false), 3700)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(()=>{})
    }
  }

  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    const dur = v.duration
    if (dur && isFinite(dur) && dur > 0) v.playbackRate = dur / 3
    else v.playbackRate = 3
    v.play().catch(() => {})
  }

  return (
    <div className="min-h-screen bg-bg text-fg overflow-x-hidden relative">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loader"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{ x: "100%", transition: { duration: 1.15, ease: [0.76, 0, 0.24, 1] } }}
            style={{ background: "#060607", boxShadow: "40px 0 80px rgba(0,0,0,0.9)" }}
          >
            <motion.div
              className="relative overflow-hidden will-change-transform"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={ videoVisible ? { scale: 1, opacity: 1, filter: "brightness(1)" } : { scale: 0.82, opacity: 0, filter: "brightness(0.5) blur(2px)", transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] } } }
              transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
              style={{ width: 150, height: 150, background: "#060607" }}
            >
              <video
                ref={videoRef}
                src="/crystal.mp4"
                preload="auto"
                muted
                autoPlay
                playsInline
                onLoadedMetadata={handleLoadedMetadata}
                onCanPlay={handleLoadedMetadata}
                className="w-full h-full object-cover"
                style={{ background: "#060607", filter: "brightness(0.95) contrast(1.02) saturate(0.96)" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grain */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.06] mix-blend-soft-light z-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Header — transparent 0% + mobile = desktop */}
      <header className="sticky top-0 z-20 h-[56px] flex justify-between items-center px-6 md:px-10 bg-transparent backdrop-blur-none font-mono text-[10px] tracking-[0.16em] uppercase">
        <a className="flex items-center no-underline" href="#hero" aria-label="Back to top"><img src="/logo.png" alt="WHY GGG" className="h-[28px] w-auto block" /></a>
        <nav className="flex items-center gap-4 md:gap-7">
          <a className="text-muted hover:text-fg no-underline before:content-['['] before:mr-1 before:opacity-40 after:content-[']'] after:ml-1 after:opacity-40" href="#">Home</a>
          <a className="text-muted hover:text-fg no-underline before:content-['['] before:mr-1 before:opacity-40 after:content-[']'] after:ml-1 after:opacity-40" href="#">About</a>
          <a className="text-muted hover:text-fg no-underline before:content-['['] before:mr-1 before:opacity-40 after:content-[']'] after:ml-1 after:opacity-40" href="#">Work</a>
          <a className="text-muted hover:text-fg no-underline before:content-['['] before:mr-1 before:opacity-40 after:content-[']'] after:ml-1 after:opacity-40" href="#">Contact</a>
        </nav>
        <div className="flex items-center gap-5 text-muted" aria-hidden="true"></div>
      </header>

      {/* HERO — lamalama style, FLUID FULL BLEED BEHIND TEXT */}
      <section id="hero" className="relative z-10 overflow-hidden min-h-[88vh] flex flex-col justify-center p-0">
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#060607]">
          <video muted autoPlay loop playsInline preload="auto" className="w-full h-full object-cover" style={{ filter: "brightness(0.72) saturate(0.95) contrast(1.05)" }}>
            <source src="/fluid.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(6,6,7,0.22) 0%, rgba(6,6,7,0.38) 50%, rgba(6,6,7,0.72) 78%, rgba(6,6,7,0.94) 92%, #060607 100%)" }} />
        </div>
        <div className="relative z-10 px-6 md:px-10 pt-[96px] pb-[80px]">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-8">
            <span className="w-7 h-px bg-line" /> [ We are WHY GGG ]
          </div>
          <h1 className="font-sans font-semibold text-[clamp(42px,7.2vw,108px)] leading-[0.88] tracking-[-0.05em] text-fg">
            <span className="block">A <span className="font-bold">creative</span> digital</span>
            <span className="block">land that hits</span>
            <span className="block"><span className="font-bold">harder</span>, works</span>
            <span className="block">smarter —</span>
            <span className="block">or not at all.</span>
          </h1>
          <p className="max-w-[560px] mt-9 font-mono text-[12px] leading-[1.7] text-muted">
            Independent — design, code, and motion. No pitch, just things I want to see exist.
          </p>
          <div className="mt-12 flex gap-6 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
            <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-fg" /> Personal Landing</span>
            <span className="hidden md:flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-fg" /> General Sans + JetBrains Mono</span>
          </div>
        </div>
      </section>

      {/* Manifesto — 21st.dev scroll reveal (no extra text) */}
      <div className="relative z-10">
        <ScrollWordReveal />
      </div>

      {/* Work */}
      <section className="relative z-10 px-6 md:px-10">
        <div className="py-8 flex justify-between items-center font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
          <span>[ Archive — notes & experiments ]</span><span className="text-fg">03 / 03</span>
        </div>

        <div className="py-9 flex justify-between items-center cursor-pointer">
          <div className="flex items-baseline gap-5"><span className="font-mono text-[11px] tracking-[0.1em] text-muted">01</span><RevealWorkTitle text="Jack & AI" boldIndices={[2]} /></div>
          <div className="flex items-center gap-4"><div className="hidden md:flex gap-2 font-mono text-[10px] tracking-[0.12em] uppercase text-muted"><span className="bg-white/[0.04] rounded-full px-[10px] py-[6px]">Study</span><span className="bg-white/[0.04] rounded-full px-[10px] py-[6px]">Experiment</span></div><div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-muted">+</div></div>
        </div>
        <div className="grid md:grid-cols-[1.4fr_0.6fr] gap-4 pb-9">
          <div className="h-[220px] bg-[#111114] rounded-2xl flex items-center justify-center font-mono text-[10px] tracking-[0.14em] uppercase text-muted">01 — study</div>
          <div className="h-[220px] bg-[#0e0e10] rounded-2xl flex items-center justify-center font-mono text-[10px] tracking-[0.14em] uppercase text-muted">01 — notes</div>
        </div>

        <div className="py-9 flex justify-between items-center cursor-pointer">
          <div className="flex items-baseline gap-5"><span className="font-mono text-[11px] tracking-[0.1em] text-muted">02</span><RevealWorkTitle text="Moov Movement" boldIndices={[1]} /></div>
          <div className="flex items-center gap-4"><div className="hidden md:flex gap-2 font-mono text-[10px] tracking-[0.12em] uppercase text-muted"><span className="bg-white/[0.04] rounded-full px-[10px] py-[6px]">Research</span></div><div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-muted">+</div></div>
        </div>
        <div className="grid md:grid-cols-[1.4fr_0.6fr] gap-4 pb-9">
          <div className="h-[220px] bg-[#0e0e10] rounded-2xl flex items-center justify-center font-mono text-[10px] tracking-[0.14em] uppercase text-muted">02 — research</div>
          <div className="h-[220px] bg-[#111114] rounded-2xl flex items-center justify-center font-mono text-[10px] tracking-[0.14em] uppercase text-muted">02 — archive</div>
        </div>

        <div className="py-9 flex justify-between items-center cursor-pointer">
          <div className="flex items-baseline gap-5"><span className="font-mono text-[11px] tracking-[0.1em] text-muted">03</span><RevealWorkTitle text="Gardeners United" boldIndices={[1]} /></div>
          <div className="flex items-center gap-4"><div className="hidden md:flex gap-2 font-mono text-[10px] tracking-[0.12em] uppercase text-muted"><span className="bg-white/[0.04] rounded-full px-[10px] py-[6px]">Personal</span></div><div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-muted">+</div></div>
        </div>
      </section>

      {/* Closing — personal, no pill */}
      <section className="relative z-10 px-6 md:px-10 pt-[80px] pb-[60px] flex flex-col gap-6">
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">[ Say hi ]</div>
        <div className="font-sans font-semibold text-[clamp(36px,6vw,88px)] leading-[0.9] tracking-[-0.05em] text-fg">
          Building<br />quietly.
        </div>
        <div className="mt-4 flex gap-5 font-mono text-[12px] tracking-[0.12em] uppercase text-muted">
          <a href="mailto:hi@whyggg.com" className="text-fg no-underline hover:opacity-70">hi@whyggg.com</a>
          <span className="opacity-30">•</span>
          <a href="#" className="hover:text-fg no-underline">Are.na</a>
          <a href="#" className="hover:text-fg no-underline">GitHub</a>
        </div>
      </section>

      <footer className="relative z-10 px-6 md:px-10 py-[26px] flex flex-col md:flex-row justify-between gap-6 font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
        <span>© 2026 WHY ✴︎ GGG — All Rights Reserved</span>
        <div className="flex items-center gap-6">
          <span className="hidden md:flex">General Sans + JetBrains Mono + 21st.dev</span>
          <button onClick={replay} className="border border-line rounded-full px-4 py-2 hover:border-fg/20 hover:text-fg transition-colors">Replay Loader →</button>
        </div>
      </footer>
    </div>
  )
}
