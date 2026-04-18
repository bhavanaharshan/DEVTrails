import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({ 
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true 
      }
    })
  ],
  server: {
    host: true,        // ✅ Required: Allows Docker to expose the server to your laptop
    port: 5173,        // ✅ Aligned with your current Vite output (image_9e95c9.png)
    strictPort: true,  // ✅ Prevents Vite from switching ports if 5173 is busy
    watch: {
      usePolling: true // ✅ Required for hot-reload to work on Windows Docker volumes
    }
  }
})