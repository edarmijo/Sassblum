import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Una sola instancia de three.js en el bundle (elimina el warning
    // "Multiple instances of Three.js being imported")
    dedupe: ['three'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
