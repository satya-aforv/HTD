import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Handle /api/htd paths
      "/api/htd": {
        target: "http://localhost:5001/htd",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/htd/, '')
      },
      // Handle all other /api paths
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
  },
});
