# WHY ✴︎ GGG — Personal Landing

Portfolio personal / editorial — situs statis **vanilla** (HTML · CSS · JS, tanpa
framework, tanpa build step). Multi-halaman dengan **transisi deck-wipe**
(4 panel kartu sapu-menutup/membuka, WAAPI transform), rail arsip horizontal di home, dan halaman work berupa
**carousel 3D loop** (pola hero OCULAR / garis keturunan huyml.co).

Live: https://why-ggg.wahanggaaa.workers.dev/
Branch pengembangan: `arsitektur-awwwards` · Production: `main` (merge = keputusan manual).

## Halaman
- **index.html** — hero video `fluid.mp4` full-bleed + judul kinetik (terurai +
  blur + fade saat scroll, desktop saja) → `01 ARCHIVE` (rail horizontal
  sticky-pin; 6 kartu projek live; klik kartu = masuk `work.html#slug`; HUD =
  progress bar + panah ← → polos tanpa pill) → `02 LOG` → closing → footer
  (counter kunjungan + link Full index). **Loader crystal (`crystal.mp4`)
  muncul setiap home dimuat** (refresh / direct / back / arrival) — dan hanya
  di home.
- **work.html** — carousel 3D loop 10 projek live: kartu pusat + parallax mouse,
  4 sudut mengintip (prev/next + peek) + 2 melayang + 2 sliver tepi (morph clip-path),
  fly-by kamera saat transisi, **intro kocokan 5 babak ±3 dtk + skip**
  (LQIP blur-up: main instan, kartu menajam progresif — mulus sejak
  kunjungan pertama), status `loading the playlist…`, fling governor (momentum
  berpagu maks 2,5 section), scroll-snap lembut, counter & info teks sinkron,
  toggle `[ list ]` overlay daftar inline, chromatic RGB-split saat velocity tinggi.
  Klik kartu mengintip = pusatkan; klik kartu pusat = buka situs live (tab baru).
  Deep-link `work.html#<slug>`.
- **full.html** — index polos 10 karya (kode arsip `26.XX`, filter kategori +
  count, tautan carousel → + live ↗); ditaut dari UI work + semua footer.
  Tanpa nav utama.
- **llms.txt** — peta situs + daftar projek + kontak untuk konsumen AI.
- **lab.html** — running systems & eksperimen (daftar mono + thumbnail kode + status); ditaut dari footer.
- **about.html**, **contact.html**, **404.html** — chrome & token desain sama dengan
  home (migrasi bahasa desain selesai SEP 2026; isi/layout tidak berubah).
- About / contact / work / full / lab / 404 **tidak punya loader**.
- Semua halaman: easter egg (`assets/egg.js`) — pesan console + klik logo ✴︎ 5×
  (lintas-halaman) memicu toast + putaran spark.

## Struktur
```
index.html  about.html  contact.html  work.html  full.html  lab.html  404.html  llms.txt  # MANUAL
assets/
  home.css  home.js        # design system + logika home (loader, rail, log, closing)
  work.css  work.js        # carousel 3D loop halaman work
  egg.js                   # easter egg global (console + spark 5x)
  cmdk.js                  # command palette CMD+K (halaman · projek · live · aksi salin)
  navp.js                  # nav hover preview + magnet tombol (desktop)
  proj/*.webp              # thumbnail = screenshot hero 10 projek live (1100px)
vendor/                    # gsap, ScrollTrigger, lenis (self-hosted)
fonts/                     # General Sans + JetBrains Mono (woff2, self-hosted)
crystal.mp4  fluid.mp4  og-image.jpg
wrangler.toml  .assetsignore  DEPLOY.md
```

## Aturan desain yang mengunci (jangan dilanggar tanpa keputusan pemilik)
1. Loader crystal = home-only, selalu muncul tiap home dimuat.
2. Hero home = video `fluid.mp4` full-bleed; tanpa kicker/progress bar header.
3. Palet teks: ink `#e9e9ea` & mut `#9a9a9e`; aksen sand `#f0d9a0` hanya di spot asli
   (indeks rail, hover panah/link, progress bar, angka total, indeks full.html,
   tipe log, status lab, baris aktif palette).
4. Rail mobile = swipe native scroll-snap (bukan drag JS).
5. **Tanpa tombol pill** selamanya (closing pakai link mono polos; panah rail polos).
6. Transisi antar-halaman = deck-wipe (`assets/wipe.js`, WAAPI transform/opacity).
   Entry membuka di semua halaman kecuali index (loader) & work (intro).
7. **UI tidak berubah tanpa keputusan pemilik repo.**

## Menambah projek baru
1. Screenshot hero situs projek (1280×720) → konversi webp lebar 1100px →
   `assets/proj/<slug>.webp`.
2. `work.html`: tambah `<a class="slide" href="https://<slug>.pages.dev/" …>`
   (urutan bebas; info ada di JS).
3. `assets/work.js`: tambah slug di `ORDER` dan entri `{cat,title,desc}` di `slideData`
   pada posisi yang sama.
4. `full.html`: tambah satu `.fx-row` (kode `26.XX` + `data-tags` filter + carousel + live);
   `work.html`: tambah satu `.wl-row` di overlay list; `assets/cmdk.js`: tambah entri `PROJ`;
   `llms.txt`: tambah satu baris projek.
5. Opsional: pasang di rail home (`index.html`, slot 6 kartu) dengan href
   `work.html#<slug>`.

## Lokal
```bash
python3 -m http.server 8080     # lalu buka http://localhost:8080/
```

## Deploy
Lihat `DEPLOY.md`. Ringkas: push ke `arsitektur-awwwards`; rilis = merge ke `main`
lalu `wrangler deploy` (Cloudflare Workers Assets).
