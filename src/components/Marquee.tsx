import { site } from "../content/site";

/** Marquee edge-to-edge — salinan 2x agar loop translateX(-50%) mulus. */
export function Marquee() {
  const items = [...site.marquee, ...site.marquee];

  return (
    <section aria-hidden className="overflow-hidden border-y border-line py-5 md:py-7">
      <div className="flex w-max animate-marquee whitespace-nowrap motion-reduce:animate-none">
        {items.map((item, i) => (
          <span key={i} className="flex items-center">
            <span
              className={`px-6 font-display text-2xl font-semibold uppercase tracking-tight md:px-8 md:text-4xl ${
                i % 2 ? "text-outline" : "text-paper"
              }`}
            >
              {item}
            </span>
            <span className="text-lg text-accent md:text-2xl">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}
