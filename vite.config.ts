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
        target: "https://htd-backend.onrender.com/htd",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/htd/, ""),
      },
      // Handle all other /api paths
      "/api": {
        target: "https://htd-backend.onrender.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
