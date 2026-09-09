# Deploy & Workflow — WHY ✴︎ GGG

Situs statis **vanilla** (HTML/CSS/JS) yang **dipelihara manual** di branch
pengembangan. Tidak ada build step: file di root repo = file yang disajikan.

> Semua halaman (`index/about/contact/work/full/lab/404`, plus `llms.txt`) disunting
> langsung di root repo — tidak ada build step dan tidak ada generator.

## Peta lingkungan

| Lingkungan | Branch | Peran |
|---|---|---|
| Pengembangan | `arsitektur-awwwards` | semua revisi & kerja harian |
| Production | `main` | situs live (Cloudflare Workers Assets + domain custom) |

Aturan tetap: **tidak ada commit/edit langsung di `main`**. Rilis = merge
`arsitektur-awwwards` → `main` atas keputusan pemilik repo.

## Siklus kerja harian

1. Kerja di `arsitektur-awwwards`.
2. Edit file halaman/asset langsung:
   - desain & logika home: `assets/home.css`, `assets/home.js`
   - halaman work: `work.html`, `assets/work.css`, `assets/work.js`
   - konten halaman: `index.html`, `about.html`, `contact.html`, `full.html`, `lab.html`, `404.html`, `llms.txt`
   - global: `assets/egg.js` (easter egg, dimuat semua halaman)
   - thumbnail projek: `assets/proj/<slug>.webp`
3. Uji lokal: `python3 -m http.server 8080`.
   Checklist cepat: 0 console error · rail mobile swipe native · loader hanya di home ·
   intro work: LQIP instan lalu kocok 5 babak ±3,5 dtk (skip via scroll/klik;
   wload hilang, counter jalan) ·
   full.html 10 baris · cmd+k jalan ·
   transisi blur fokus antar-halaman · reduced-motion jatuh ke fallback.
4. Commit + push ke `arsitektur-awwwards`.

## Gerbang rilis (wajib sebelum merge ke `main`)

1. Statis: semua JS lolos `node --check` (termasuk inline), HTML balance tanpa
   id ganda, CSS kurawal seimbang, JSON-LD valid, tidak ada link/asset lokal 404,
   tidak ada kode yatim (id/class/fungsi tak terpakai).
2. Runtime desktop + mobile: 7 halaman 0 console/page error, 0 request gagal;
   loader home selesai; intro work main instan (LQIP) lalu kocok ±3,5 dtk; toggle LOG, filter full, palette cmd+k,
   overlay list, deep-link `#slug` berfungsi; tanpa overflow-x; tanpa overlap UI.
3. Reduced-motion: work jatuh ke grid `no-wn` tanpa error.
4. `sitemap.xml` + `llms.txt` + `02 LOG` + docs selaras dengan isi rilis.

## Deploy ke production

```bash
# 1) merge pengembangan ke main (keputusan pemilik)
git checkout main && git merge arsitektur-awwwards && git push origin main

# 2) deploy Workers Assets dari root repo (branch main)
npx wrangler deploy
```

- Konfigurasi: `wrangler.toml` — Workers Assets dengan directory root repo.
- 404 custom: `not_found_handling = "404-page"` — URL yang tak cocok file otomatis
  menyajikan `404.html` dengan status 404 (tanpa Worker, tanpa biaya invocasi).
  Semua ref di `404.html` wajib absolut (`/...`) karena disajikan di URL sedalam
  apa pun; uji sarang: sajikan `404.html` di path `/foo/bar` dan pastikan 0 request gagal.
- `.assetsignore` memastikan file non-publik (`DEPLOY.md`, `wrangler.toml`, `.git`, `.wrangler`, `.gitignore`) tidak ikut ter-deploy;
  `vendor/`, `assets/`, `fonts/` **ikut** ter-deploy.
- `full.html`, `lab.html` & `llms.txt` ikut ter-deploy otomatis (file statis di root).
- URL live: https://why-ggg.wahanggaaa.workers.dev/ (＋ domain custom via dashboard).
- Rollback: `npx wrangler deployments list` → `npx wrangler rollback <version-id>`.

## Catatan operasional

- **View Transitions** cross-document (blur fokus) aktif di semua halaman via CSS
  inline `#vtCss`; header ikut morph (`view-transition-name: vt-nav`).
- Deep-link carousel work: `work.html#<slug>` (slug = nama file webp di `assets/proj/`).
- Semua library (GSAP, ScrollTrigger, Lenis, font) **self-hosted** — tanpa CDN.
- Video hero (`fluid.mp4`) tidak di-preload sejak audit SEP 2026 (streaming natural);
  `crystal.mp4` tetap di-preload karena dipakai loader home.
- Intro work = riffle-burst + deal (GSAP, transform 3D murni); LQIP blur-up
  (kartu mungil inline ~1KB, full menajam progresif; nunggu hero + font berkap;
  pra-raster opacity 0.01; tanpa tween clip-path) menjaga first-open tetap
  mulus di jaringan lambat — jangan dilepas tanpa ganti.
- Keamanan: pernah ada PAT GitHub muncul di riwayat chat/sesi — **rotasi token** bila
  masih aktif; gunakan token ber-scope repo hanya via environment/CLI, jangan di file.
