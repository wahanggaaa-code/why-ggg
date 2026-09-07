# WHY ✴︎ GGG — Personal Landing

Editorial personal landing, satu file `index.html` (vanilla, tanpa build).
Live: https://why-ggg.wahanggaaa.workers.dev/

## Struktur
- `index.html` — seluruh halaman (markup, CSS, JS inline)
- `wrangler.toml` — deploy ke Cloudflare Workers (`[assets] directory="./"`)
- `DEPLOY.md` — panduan workflow staging (gh-pages) → production (main)

## Workflow
1. Revisi di branch `gh-pages` (preview GitHub Pages).
2. Merge ke `main`.
3. Push `main` → auto-deploy (Cloudflare build / GitHub Actions).

## Lokal
```bash
python3 -m http.server 8080   # preview
```
