import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const certDir = path.resolve(__dirname, '.certs')
  const pfxPath = path.join(certDir, 'ecbills-dev.pfx')
  const httpsEnabled = fs.existsSync(pfxPath)
  const pythonAudioTarget = env.VITE_PYTHON_AUDIO_TARGET || 'http://192.168.10.144:8001'

  return {
    plugins: [react()],
    assetsInclude: ['**/*.glb'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return null
            if (id.includes('react-router')) return 'router'
            if (id.includes('recharts')) return 'charts-vendor'
            if (id.includes('jspdf')) return 'pdf-vendor'
            if (id.includes('lucide-react')) return 'icons-vendor'
            return null
          },
        },
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      https: httpsEnabled
        ? {
            pfx: fs.readFileSync(pfxPath),
            passphrase: 'ecbills-dev-cert',
          }
        : undefined,
      proxy: {
        '/py-audio': {
          target: pythonAudioTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (value) => value.replace(/^\/py-audio/, '/audio'),
        },
      },
    },
  }
})
