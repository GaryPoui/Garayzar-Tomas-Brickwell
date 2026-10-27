import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = {
    '/api': {
      target: env.API_PROXY_TARGET || 'http://localhost:3000',
      changeOrigin: true,
    },
  }

  return {
    // GitHub Pages serves this project from /<repository-name>/.
    base: '/Garayzar-Tomas-Brickwell/',
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
