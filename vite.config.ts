import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    // Default "/" untuk dev & preview.
    // Saat deploy ke GitHub Pages (project page), set VITE_BASE="/why-ggg/"
    // (sudah dilakukan otomatis oleh .github/workflows/deploy.yml)
    base: env.VITE_BASE || "/",
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
      // Izinkan host preview sandbox (e2b.app)
      allowedHosts: true,
    },
  };
});
