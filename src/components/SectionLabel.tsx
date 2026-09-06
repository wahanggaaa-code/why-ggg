import type { ReactNode } from "react";

/** Label section kecil mono, gaya "( label )" ala studio. */
export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.25em] text-mute ${className}`}>
      {children}
    </p>
  );
}
