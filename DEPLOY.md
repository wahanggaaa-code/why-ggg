# Deploy & Workflow — WHY ✴︎ GGG

Satu sumber kebenaran: **vanilla `index.html`** (tanpa build). Kedua branch `main` dan
`gh-pages` selalu dijaga **identik** supaya merge aman.

## Peta lingkungan
| Lingkungan | Branch | Host | Peran |
|---|---|---|---|
| Production | `main` | Cloudflare Pages (domain custom) | Situs live |
| Staging / preview | `gh-pages` | GitHub Pages (`wahanggaaa-code.github.io/why-ggg`) | Tempat revisi & cek |
| Cadangan React | `react-archive` (lokal) | — | Arsip app React, tidak di-deploy |

## Alur kerja (staging → production)
1. **Revisi di `gh-pages`** — edit konten/efek, commit.
2. **Cek preview** di GitHub Pages (`...github.io/why-ggg`).
3. **Merge ke `main`**: `git checkout main && git merge gh-pages && git push origin main`.
4. **Cloudflare auto-deploy** `main` (±1 menit).

> Aturan: jangan edit `main` langsung. Semua perubahan lahir di `gh-pages`.

## Setup GitHub Pages (staging)
Settings → **Pages** → Build and deployment → Source: **Deploy from a branch** →
Branch: **`gh-pages`**, folder `/` → Save.

## Setup Cloudflare Pages (production)
1. Cloudflare Dashboard → **Workers & Pages** → Create → **Pages** → Connect to Git.
2. Pilih repo `wahanggaaa-code/why-ggg`.
3. Konfigurasi build:
   - Production branch: **`main`**
   - Framework preset: **None**
   - Build command: *(kosongkan)*
   - Build output directory: **`/`**
4. (Opsional) Tambahkan domain custom di tab **Custom domains**.

## Setelah domain custom live
Karena path relatif, situs jalan di domain apa pun. Tapi perbarui referensi absolut:
- `index.html`: `<link rel="canonical">` dan JSON-LD `url`/`sameAs`
- `sitemap.xml`: `<loc>`
- `robots.txt`: baris `Sitemap:`

## Menambah entri LOG (rutin)
Copy template di `index.html` (komentar dalam `#log`), isi tanggal/teks/tag,
taruh sebagai baris **paling atas** `.log-list`, lalu commit di `gh-pages`.

## Keamanan
- Jangan commit token/secret. Push lewat SSH atau token sementara, lalu **revoke**.
- Repo publik: history lama masih memuat folder React. Bila ingin bersih total,
  jadikan repo private atau rewrite history.
