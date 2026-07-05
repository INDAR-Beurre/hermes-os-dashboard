import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:9119', changeOrigin: true },
    },
  },
  build: {
    outDir: '../hermes_cli/os_dashboard_dist',
    emptyOutDir: true,
  },
})
