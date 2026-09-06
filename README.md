# why-ggg

Personal landing page — full-viewport sections, edge-to-edge, animasi halus dengan **motion** (framer motion) + **Lenis** smooth scroll.

Terinspirasi: [hellohello.is](https://www.hellohello.is/) (preloader + detail mono di sudut) dan [lamalama.com](https://lamalama.com/) (hero video + tipografi besar).

## Struktur

- **Preloader** — video kecil di tengah (fast-forward: 1 loop = 3 detik), counter 00→100, detail mono 4 sudut, exit curtain slide-up
- **Hero** — headline word-by-word reveal + video kecil dengan kontrol putar/jeda
- **Marquee** — strip bergerak edge-to-edge
- **Tentang** — manifesto + statistik (counter animasi)
- **Filosofi** — statement besar, parallax
- **Karya** — grid project cards, hover effect (slot untuk component 21st.dev)
- **Keahlian** — baris besar hover-shift
- **Perjalanan** — timeline
- **Kontak** — CTA raksasa + live clock WIB

## Edit konten

Semua teks, project, socials, dan URL video ada di **satu file**:

```
src/content/site.ts
```

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build production → dist/
```

## Stack

Vite · React 19 · TypeScript · Tailwind CSS 4 · motion · Lenis
