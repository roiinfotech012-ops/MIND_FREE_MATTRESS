import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = env.PORT || '3001'
  const proxyTarget = env.API_PROXY_TARGET || `http://127.0.0.1:${apiPort}`
  const rawAllowedHosts = (env.ALLOWED_HOSTS || 'all').trim()
  const allowedHosts: true | string[] =
    rawAllowedHosts === 'all' || rawAllowedHosts === '*'
      ? true
      : rawAllowedHosts
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: env.HOST || '0.0.0.0',
      port: Number(env.VITE_PORT || 5173),
      allowedHosts,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: env.HOST || '0.0.0.0',
      port: Number(env.VITE_PREVIEW_PORT || 4173),
      allowedHosts,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
