import { site } from "../content/site";
import { RevealText } from "./RevealText";
import { SectionLabel } from "./SectionLabel";

export function Timeline() {
  return (
    <section
      id="perjalanan"
      className="flex min-h-[100svh] flex-col justify-center px-5 py-24 md:px-10"
    >
      <SectionLabel>{site.journey.label}</SectionLabel>

      <div className="mt-14 flex flex-col gap-14 md:gap-20">
        {site.journey.items.map((j) => (
          <div
            key={j.year}
            className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr] md:gap-10"
          >
            <RevealText
              text={j.year}
              className="font-display text-5xl font-semibold tracking-tight text-paper/90 md:text-7xl"
            />
            <div>
              <RevealText
                text={j.title}
                delay={0.1}
                className="font-display text-2xl font-semibold tracking-tight md:text-4xl"
              />
              <RevealText
                text={j.note}
                delay={0.2}
                className="mt-2 block max-w-md text-sm leading-relaxed text-mute md:text-base"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
