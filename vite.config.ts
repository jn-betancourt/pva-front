import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const AZURE_HOST = 'https://pva-awd3d3bmcrbre3et.westus3-01.azurewebsites.net'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: AZURE_HOST,
        changeOrigin: true,
        secure: true,
      },
      '/actuator': {
        target: AZURE_HOST,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
