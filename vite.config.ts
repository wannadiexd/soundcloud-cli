import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
    ignored: ["**/src-tauri/**"],
  },
    proxy: {
      "/sc-api": {
        target: "https://api-v2.soundcloud.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sc-api/, ""),
      },
      "/sc-media": {
        target: "https://api-v2.soundcloud.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sc-media/, ""),
      },
      "/sc-cdn": {
        target: "https://cf-media.sndcdn.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sc-cdn/, ""),
      },
      "/sc-auth": {
        target: "https://api.scdinternal.site",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sc-auth/, ""),
      },
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: ["es2021", "chrome100", "safari13"],
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});