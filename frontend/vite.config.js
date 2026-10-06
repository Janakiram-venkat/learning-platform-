import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The Pyodide worker imports the runtime from a CDN via a native ESM import,
  // so workers must be emitted as ES modules (not the default IIFE).
  worker: {
    format: 'es',
    rollupOptions: {
      external: [/^https:\/\/cdn\.jsdelivr\.net\//],
    },
  },
})
