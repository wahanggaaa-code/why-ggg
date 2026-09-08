# WHY ✴︎ GGG — Personal Landing

Portfolio personal / editorial — situs statis **vanilla** (HTML · CSS · JS, tanpa
framework, tanpa build step). Multi-halaman dengan **View Transitions** cross-document
(blur fokus + morph header), rail arsip horizontal di home, dan halaman work berupa
**carousel 3D loop** (pola hero OCULAR / garis keturunan huyml.co).

Live: https://why-ggg.wahanggaaa.workers.dev/
Branch pengembangan: `arsitektur-awwwards` · Production: `main` (merge = keputusan manual).

## Halaman
- **index.html** — hero video `fluid.mp4` full-bleed + judul kinetik → `01 ARCHIVE`
  (rail horizontal sticky-pin; 6 kartu projek live; klik kartu = masuk `work.html#slug`)
  → `02 LOG` → closing → footer. **Loader crystal (`crystal.mp4`) muncul setiap home
  dimuat** (refresh / direct / back / arrival) — dan hanya di home.
- **work.html** — carousel 3D loop 10 projek live: kartu pusat + parallax mouse,
  kartu prev/next mengintip dari sudut (morph clip-path), 2 kartu melayang redup,
  fly-by kamera saat transisi, intro *deck-shuffle* setelah load, scroll-snap lembut,
  counter & info teks sinkron. Klik kartu mengintip = pusatkan; klik kartu pusat =
  buka situs live (tab baru). Deep-link `work.html#<slug>`.
- **about.html**, **contact.html**, **404.html** — chrome & token desain sama dengan
  home (migrasi bahasa desain selesai SEP 2026; isi/layout tidak berubah).
- About / contact / work / 404 **tidak punya loader**.

## Struktur
```
index.html  about.html  contact.html  work.html  404.html   # dipelihara MANUAL
assets/
  home.css  home.js        # design system + logika home (loader, rail, log, closing)
  work.css  work.js        # carousel 3D loop halaman work
  proj/*.webp              # thumbnail = screenshot hero 10 projek live (1100px)
vendor/                    # gsap, ScrollTrigger, lenis (self-hosted)
fonts/                     # General Sans + JetBrains Mono (woff2, self-hosted)
crystal.mp4  fluid.mp4  og-image.jpg
tools/build-site.py        # generator LEGACY — punya guard: MENOLAK menulis index.html
                           # kecuali env ALLOW_INDEX_CLOBBER=1. Jangan mengandalkan ini.
wrangler.toml  .assetsignore  DEPLOY.md
```

## Aturan desain yang mengunci (jangan dilanggar tanpa keputusan pemilik)
1. Loader crystal = home-only, selalu muncul tiap home dimuat.
2. Hero home = video `fluid.mp4` full-bleed; tanpa kicker/progress bar header.
3. Palet teks: ink `#e9e9ea` & mut `#9a9a9e`; aksen sand `#f0d9a0` hanya di spot asli
   (indeks rail, hint panah, hover, progress bar, angka total).
4. Rail mobile = swipe native scroll-snap (bukan drag JS).
5. **Tanpa tombol pill** selamanya (closing pakai link mono polos).
6. Transisi antar-halaman = View Transitions blur fokus (CSS murni) + morph header
   `vt-nav`. Tidak ada JS curtain/WebGL antar-halaman.
7. **UI tidak berubah tanpa keputusan pemilik repo.**

## Menambah projek baru
1. Screenshot hero situs projek (1280×720) → konversi webp lebar 1100px →
   `assets/proj/<slug>.webp`.
2. `work.html`: tambah `<a class="slide" href="https://<slug>.pages.dev/" …>` (urutan
   bebas) + blok `.wi` tidak dipakai lagi (info ada di JS).
3. `assets/work.js`: tambah slug di `ORDER` dan entri `{cat,title,desc}` di `slideData`
   pada posisi yang sama.
4. Opsional: pasang di rail home (`index.html`, slot 6 kartu) dengan href
   `work.html#<slug>`.

## Lokal
```bash
python3 -m http.server 8080     # lalu buka http://localhost:8080/
```

## Deploy
Lihat `DEPLOY.md`. Ringkas: push ke `arsitektur-awwwards`; rilis = merge ke `main`
lalu `wrangler deploy` (Cloudflare Workers Assets).
