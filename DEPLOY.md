# Deploy & Workflow — WHY ✴︎ GGG

Situs statis **vanilla** (HTML/CSS/JS) yang di-*generate* dari `tools/build-site.py`
(sumber materi ada di `tools/base/`). Tidak ada build step modern — hasil generate
langsung disajikan sebagai aset.

> Arsitektur lama (staging `gh-pages` identik dengan `main`) **tidak dipakai lagi**.
> Branch `gh-pages` sudah dihapus. Revisi kini hidup di branch pengembangan
> `arsitektur-awwwards`.

## Peta lingkungan

| Lingkungan | Branch | Host | Peran |
|---|---|---|---|
| Pengembangan | `arsitektur-awwwards` | lokal / preview | Tempat semua revisi & kerja harian |
| Production | `main` | Cloudflare Workers (Assets) + domain custom | Situs live |

> Aturan: **jangan commit/edit langsung di `main`**. Semua perubahan lahir di
> `arsitektur-awwwards`, baru digabung ke `main` saat mau rilis.

## Siklus kerja harian

1. Kerjakan di cabang `arsitektur-awwwards`.
2. Ubah **sumber**, bukan hasil:
   - struktur/isi halaman & gaya: `tools/base/` (index.html, about.html, 404.html),
   - data proyek & logika: `tools/build-site.py` (daftar `WORK`, CSS/JS),
   - aset media: langsung di root repo (`crystal.mp4`, `fluid.mp4`, `*.webp`, `fonts/`, `logo.png`).
3. Regenerasi seluruh halaman:
   ```bash
   python3 tools/build-site.py
   ```
   Hasil menimpa: `index.html`, `about.html`, `contact.html`, `work/*.html`, `404.html`.
4. Commit & push:
   ```bash
   git add -A
   git commit -m "..."
   git push origin arsitektur-awwwards
   ```
   (Preview lokal: `python3 -m http.server 8080` dari root repo.)

## Rilis ke production (main → Cloudflare)

1. `git checkout main`
2. `git merge arsitektur-awwwards`
3. `git push origin main`
4. Cloudflare auto-deploy `main` (±1 menit) — URL workers.dev / domain custom otomatis terbarui.

> Jika ingin menengok halaman sebelum rilis: GitHub Pages bisa dibuat dari branch
> apa pun secara manual (Settings → Pages → Source branch `arsitektur-awwwards`),
> tapi itu opsional & tidak lagi jadi bagian alur wajib.

## Setup Cloudflare Workers + Assets (production)

Konfigurasi di dashboard Cloudflare (bukan lewat file ini):
1. Workers & Pages → connect repo `wahanggaaa-code/why-ggg`.
2. Production branch: **`main`**.
3. Build command: *(kosong / None)* — repo sudah menyajikan file statis.
4. Deploy command: `npx wrangler deploy` · Version command: `npx wrangler versions upload`.
5. **WAJIB** salah satu agar build tidak gagal:
   - set env var `NODE_VERSION = 22`, **atau**
   - pin perintah ke `npx wrangler@3 ...` (kompatibel Node lama).
6. Repo harus punya `wrangler.toml` (sudah ada: `[assets] directory = "./"`).

> Mengubah settings TIDAK memicu build. Setelah mengubah, **push commit baru** atau
> klik **Retry deployment** agar build jalan.

## Setelah domain custom live

Karena semua path relatif, situs jalan di domain mana pun. Tapi perbarui referensi
absolut saat ganti domain:
- `index.html`: `<link rel="canonical">` dan JSON-LD `url` / `sameAs`
- `sitemap.xml`: `<loc>`
- `robots.txt`: baris `Sitemap:`

## Menambah karya baru (01 ARCHIVE)

1. Buka `tools/build-site.py` → daftar `WORK`.
2. Tambah satu `dict` (slug unik, nama file `img`, judul, tag, tahun, blurb, story).
3. Taruh gambar di root repo.
4. Jalankan `python3 tools/build-site.py`.
   Halaman `work/<slug>.html`, kartu rail, counter total, dan nama View-Transition
   `vt-<slug>` terbentuk otomatis.

## Menambah entri LOG (rutin)

1. Edit bagian `#log` di `tools/base/index.html` (baris **paling atas** dari daftar).
2. Jalankan `python3 tools/build-site.py`.

## Keamanan

- Jangan pernah commit token/secret ke repo.
- Push memakai token sementara (fine-grained / classic dengan scope `repo`), lalu
  **segera revoke** di GitHub Settings → Developer settings → Tokens.
- Repo bersifat publik: hindari menyimpan informasi pribadi di history.
