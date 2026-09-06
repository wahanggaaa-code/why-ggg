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
function RevealArchiveTitle({ text, boldIndices=[] }){
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.88","start 0.42"] })
  const words = text.split(" ")
  return (
    <div ref={ref} className="font-sans font-semibold text-[18px] md:text-[20px] tracking-[-0.03em] leading-none text-fg flex flex-wrap gap-x-[0.22em]" aria-label={text}>
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
function RevealArchiveHeader({ text }){
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.88","start 0.42"] })
  const words = text.split(" ")
  return (
    <div ref={ref} className="font-sans font-bold text-[clamp(18px,2.4vw,24px)] tracking-[-0.03em] uppercase text-fg flex flex-wrap gap-x-[0.22em]" aria-label={text}>
      <span className="sr-only">{text}</span>
      {words.map((w,i)=>(
        <Fragment key={`${w}-${i}`}>
          <RevealWord progress={scrollYProgress} index={i} count={words.length} reducedMotion={!!reduced}>
            <span>{w}</span>
          </RevealWord>
          {i < words.length-1 ? " " : null}
        </Fragment>
      ))}
    </div>
  )
}

const archiveData = [
  { num:"", title:"Landing Page", bold:[], media:["/aethelgard-hero.jpg","/archive-cover.webp","/lexier-cover.webp","/lexier-poster.png","/st-06.png"], tags:["editorial","landing"], isImage:true },
]
const lightboxDescs = [
  "AETHELGARD — THE HIDDEN ARCHIVE / Edition 001 Spring Archive. A journal of rare things and quiet discoveries. EST. 2026",
  "THE ARCHITECTURE OF SILENCE: The Sculpture of Eliza Reed — Editorial web page design. Essay & curation: Laura Meyers / 14 Oct 2023 / Vol.7",
  "LEXIER — The Experimental Type Studio. Technical warm paper, raw experimental, drop cap — only one accent.",
  "LEXIER POSTER — 1200×1600 px portrait, 01–05 series. ABCDEFGHIJ — warm paper & pure black.",
  "BRUSH SCRIPT — Vertical calligraphy, 2026. Gestural ink on warm paper, splatter & stroke.",
]

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [showVideo, setShowVideo] = useState(true)
  const videoRef = useRef(null)
  const trackRef = useRef(null)
  const [archiveIndex, setArchiveIndex] = useState(0)
  const [lightboxIdx, setLightboxIdx] = useState(null)

  // hellohello.is exact: respect reduced motion, video ended triggers curtain y -100%
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.dispatchEvent(new Event("hero-start"))
      setShowVideo(false)
      setIsLoading(false)
      return
    }
  }, [])
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isLoading])

  const handleVideoEnded = () => {
    // STEP 1: video hilang 100% dulu (0.6s fade+scale), baru tirai naik — jangan ikut tirai
    if (showVideo) {
      setShowVideo(false)
      setTimeout(() => {
        setTimeout(()=> window.dispatchEvent(new Event("hero-start")), 300)
        setIsLoading(false)
      }, 650)
    } else {
      setTimeout(()=> window.dispatchEvent(new Event("hero-start")), 300)
      setIsLoading(false)
    }
  }
  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    const d = v.duration
    if (d && isFinite(d) && d>0) v.playbackRate = d/3
    else v.playbackRate = 3
    v.play().catch(()=>{})
  }
  // fallback: ensure 3s — video hilang dulu baru tirai (650ms + 0.8s slide)
  useEffect(() => {
    if (!isLoading) return
    const t = setTimeout(handleVideoEnded, 3000)
    return () => clearTimeout(t)
  }, [isLoading])

  const replay = () => {
    setShowVideo(true)
    setIsLoading(true)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(()=>{})
    }
  }

  const onArchiveScroll = () => {
    const el = trackRef.current
    if (!el || !el.children[0]) return
    const w = el.children[0].offsetWidth + 16
    const idx = Math.round(el.scrollLeft / w)
    setArchiveIndex(Math.max(0, Math.min(archiveData.length-1, idx)))
  }
  const scrollArchive = (dir) => {
    const el = trackRef.current
    if (!el || !el.children[0]) return
    const w = el.children[0].offsetWidth + 16
    el.scrollBy({ left: dir * w, behavior: "smooth" })
  }
  const goArchive = (i) => {
    const el = trackRef.current
    if (!el || !el.children[0]) return
    const w = el.children[0].offsetWidth + 16
    el.scrollTo({ left: w * i, behavior: "smooth" })
  }

  useEffect(() => {
    if (lightboxIdx === null) {
      document.body.style.overflow = ''
      return
    }
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxIdx(null)
      if (e.key === 'ArrowLeft') setLightboxIdx((v) => v === null ? null : (v - 1 + archiveData[0].media.length) % archiveData[0].media.length)
      if (e.key === 'ArrowRight') setLightboxIdx((v) => v === null ? null : (v + 1) % archiveData[0].media.length)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIdx])

  return (
    <div className="min-h-screen bg-bg text-fg overflow-x-hidden relative">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loader"
            className="fixed inset-0 z-[10001] flex items-center justify-center overflow-hidden"
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.77, 0, 0.175, 1] } }}
            style={{ background: "#060607" }}
          >
            <AnimatePresence>
              {showVideo && (
                <motion.div
                  key="videoWrap"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
                  className="flex items-center justify-center"
                  style={{ width: 150, height: 150 }}
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
                    onEnded={handleVideoEnded}
                    onError={handleVideoEnded}
                    className="object-contain"
                    style={{ width: 150, height: 150, background: "transparent" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
          </div>
        </div>
      </section>

      {/* Manifesto — 21st.dev scroll reveal (no extra text) */}
      <div className="relative z-10">
        <ScrollWordReveal />
      </div>

      {/* Work — 01 ARCHIVE single carousel — header reveal, card static */}
      <section className="relative z-10 px-6 md:px-10">
        <div className="py-8 flex justify-between items-center">
          <RevealArchiveHeader text="01 ARCHIVE" />
        </div>

        <div className="relative">
          <div
            ref={trackRef}
            onScroll={onArchiveScroll}
            className="flex gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth pb-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {archiveData.map((item, i) => (
              <article key={i} className="flex-none w-[85vw] md:w-[clamp(340px,38vw,460px)] snap-start bg-[#0e0e10] border border-white/[0.06] rounded-[20px] overflow-hidden flex flex-col">
                <div className="h-[180px] md:h-[240px] flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-3 bg-transparent overflow-y-hidden pr-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {item.media.map((src, j) => (
                    <div key={j} className="flex-none w-[70%] md:w-[70%] snap-start overflow-hidden bg-[#111114] relative cursor-zoom-in group border border-white/[0.06]" onClick={() => setLightboxIdx(j)}>
                      <img src={src} alt={`${item.title} ${j+1}`} className="w-full h-full object-cover block group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
                    </div>
                  ))}
                </div>
                <div className="p-[18px] pb-5 flex flex-col gap-3 bg-[#0e0e10]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-3"><div className="font-mono font-medium text-[13px] tracking-[0.14em] uppercase text-fg">{item.title}</div></div>
                  </div>
                  <div className="flex gap-2 font-mono text-[10px] tracking-[0.12em] lowercase text-muted">{item.tags.map(t=> <span key={t} className="bg-white/[0.06] rounded-full px-[10px] py-[6px]">{t}</span>)}<span className="bg-white/[0.06] rounded-full px-[10px] py-[6px]">{String(item.media.length).padStart(2,'0')} works</span></div>
                </div>
              </article>
            ))}
          </div>
          <div className="flex gap-2 justify-center mt-3.5">
            {archiveData.map((_, i) => (
              <button
                key={i}
                onClick={()=>goArchive(i)}
                aria-label={`Go to ${i+1}`}
                className={`h-0.5 rounded-full transition-all ${i===archiveIndex ? 'w-7 bg-fg' : 'w-7 bg-white/20 hover:bg-white/30'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox — enlarge + focus blur + swipe */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-0"
            onClick={() => setLightboxIdx(null)}
          >
            <div className="absolute inset-0 bg-[#060607]/85 backdrop-blur-[16px]" />
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-11 h-11 rounded-full border border-white/10 bg-white/[0.08] text-fg flex items-center justify-center backdrop-blur-md p-0"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
            <div className="absolute inset-0 flex justify-between items-center px-3 md:px-5 pointer-events-none">
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((v) => (v - 1 + archiveData[0].media.length) % archiveData[0].media.length); }}
                className="pointer-events-auto w-9 h-9 md:w-11 md:h-11 rounded-full border border-white/10 bg-white/[0.08] text-fg flex items-center justify-center backdrop-blur-md text-[16px] md:text-[18px]"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((v) => (v + 1) % archiveData[0].media.length); }}
                className="pointer-events-auto w-9 h-9 md:w-11 md:h-11 rounded-full border border-white/10 bg-white/[0.08] text-fg flex items-center justify-center backdrop-blur-md text-[16px] md:text-[18px]"
                aria-label="Next"
              >
                ›
              </button>
            </div>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] } }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative z-10 max-w-[96vw] md:max-w-[92vw] max-h-[88vh] p-4 md:p-8 flex flex-col items-center justify-center gap-3 -translate-y-2 md:-translate-y-3"
              onClick={(e) => e.stopPropagation()}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) setLightboxIdx((v) => (v + 1) % archiveData[0].media.length);
                else if (info.offset.x > 60) setLightboxIdx((v) => (v - 1 + archiveData[0].media.length) % archiveData[0].media.length);
              }}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <img
                src={archiveData[0].media[lightboxIdx]}
                alt={`Enlarged ${lightboxIdx + 1}`}
                className="max-w-[96vw] md:max-w-[92vw] max-h-[62dvh] md:max-h-[68vh] w-auto h-auto object-contain rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] block"
                draggable={false}
              />
              <p className="font-mono text-[10px] md:text-[11px] leading-[1.6] tracking-[0.08em] text-fg text-center max-w-[520px] px-4 opacity-90">
                {lightboxDescs[lightboxIdx]}
              </p>
            </motion.div>
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-10 font-mono text-[9px] md:text-[10px] tracking-[0.14em] text-muted bg-black/40 px-3 py-1.5 rounded-full">
              {String(lightboxIdx + 1).padStart(2, '0')} / {String(archiveData[0].media.length).padStart(2, '0')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Closing — personal, no pill */}
      <section className="relative z-10 px-6 md:px-10 pt-[80px] pb-[60px] flex flex-col gap-6">
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">[ Say hi ]</div>
        <div className="flex justify-between items-end gap-8 flex-wrap">
          <div className="font-sans font-semibold text-[clamp(36px,6vw,88px)] leading-[0.9] tracking-[-0.05em] text-fg">
            Building<br />quietly.
          </div>
          <div className="font-sans font-semibold text-[clamp(36px,6vw,88px)] leading-[0.9] tracking-[-0.05em] text-fg text-right">
            ALL IN OR<br />NOTHING
          </div>
        </div>
        <div className="mt-4 flex gap-5 font-mono text-[12px] tracking-[0.12em] uppercase text-muted">
          <a href="mailto:hi@whyggg.com" className="text-fg no-underline hover:opacity-70">hi@whyggg.com</a>
          <span className="opacity-30">•</span>
          <a href="#" className="hover:text-fg no-underline">DISCORD</a>
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
