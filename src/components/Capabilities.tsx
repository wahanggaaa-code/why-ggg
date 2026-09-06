import { site } from "../content/site";
import { RevealText } from "./RevealText";
import { SectionLabel } from "./SectionLabel";

/** Daftar keahlian — baris besar edge-to-edge, hover shift + aksen. */
export function Capabilities() {
  return (
    <section
      id="keahlian"
      className="flex min-h-[100svh] flex-col justify-center px-5 py-24 md:px-10"
    >
      <SectionLabel>{site.skills.label}</SectionLabel>

      <div className="mt-12 border-b border-line">
        {site.skills.items.map((s) => (
          <div
            key={s.id}
            className="group grid grid-cols-[3rem_1fr] items-baseline gap-4 border-t border-line py-7 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:pl-4 md:grid-cols-[5rem_1fr_auto] md:py-9"
          >
            <span className="font-mono text-[11px] tracking-[0.2em] text-mute">
              ({s.id})
            </span>
            <h3 className="font-display text-3xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-accent md:text-6xl">
              <RevealText text={s.title} stagger={0.05} />
            </h3>
            <span className="col-start-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mute md:col-start-3 md:text-[11px]">
              {s.note}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
