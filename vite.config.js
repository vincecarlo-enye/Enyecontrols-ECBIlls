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
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
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
