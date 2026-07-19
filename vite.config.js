import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // For GitHub Pages, change to '/your-repo-name/'
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/stock': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/stock/, '/api/stock')
      }
    }
  },
  publicDir: 'public'
})
