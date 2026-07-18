import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // For GitHub Pages, change to '/your-repo-name/'
  server: {
    port: 3000,
    open: true
  },
  publicDir: 'public'
})
