import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/', // Cloudflare custom domain = root. Ganti '/why-ggg/' kalau pakai GitHub Project Pages
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
    headers: {
      'X-Frame-Options': 'ALLOWALL',
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
    headers: {
      'X-Frame-Options': 'ALLOWALL',
    }
  }
})
