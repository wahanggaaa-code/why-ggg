# WHY ✴︎ GGG — Personal Landing

Personal / editorial portfolio — situs statis **vanilla** (HTML · CSS · JS, tanpa
framework). Multi-halaman dengan efek **View Transitions** (blur fokus + morph
thumbnail → hero), **01 ARCHIVE** sebagai *horizontal scroll rail* yang digerakkan
scroll vertikal, dan **02 LOG** untuk catatan harian.

Live: https://why-ggg.wahanggaaa.workers.dev/

## Halaman
- **Home** — Hero video → Manifesto (scroll word reveal) → `01 ARCHIVE` (rail
  horizontal, sticky pin, HUD progress + tombol ←/→) → `02 LOG`.
- **About**, **Contact** — halaman sendiri via header nav.
- **work/`<slug>`.html** — halaman tiap karya (klik kartu rail → morph ke hero).
- **404.html**.
- Intro **loading screen** (crystal video) muncul tiap halaman utama dibuka/di-refresh.

## Struktur
```
index.html  about.html  contact.html  404.html   work/…   # hasil generate
tools/
  build-site.py    # generator utama: daftar WORK + CSS/JS + merakit semua halaman
  base/            # SUMBER materi (index/about/404) — edit di sini, bukan hasilnya
assets             # *.webp, *.mp4, *.png, fonts/, favicon…
wrangler.toml      # deploy Cloudflare Workers Assets
DEPLOY.md          # panduan workflow & deploy lengkap
```

## Mulai
```bash
# 1. Regenerasi seluruh halaman dari sumber
python3 tools/build-site.py

# 2. Preview lokal
python3 -m http.server 8080
# buka http://localhost:8080
```

## Menambah karya (01 ARCHIVE)
Edit daftar `WORK` di `tools/build-site.py` (slug, gambar, judul, tag, tahun,
blurb, story) → taruh gambar di root → jalankan `python3 tools/build-site.py`.
Kartu rail, halaman `work/<slug>.html`, penghitung, dan nama morph `vt-<slug>`
terbentuk otomatis.

## Menambah entri LOG
Edit bagian `#log` di `tools/base/index.html` (entri terbaru paling atas) →
jalankan `python3 tools/build-site.py`.

## Branch & deploy
| Branch | Peran |
|---|---|
| `arsitektur-awwwards` | Pengembangan (semua revisi di sini) |
| `main` | Production — auto-deploy Cloudflare Workers (Assets) |

Alur: kerja di `arsitektur-awwwards` → generate → commit → push → saat rilis
merge ke `main` → push `main`. Detail di [`DEPLOY.md`](DEPLOY.md).
