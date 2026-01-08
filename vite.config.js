import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/mtp-react/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*'],
      manifest: {
        id: '/mtp-react/',
        name: 'Voyager | Premium Trip Planner',
        short_name: 'Voyager',
        description: 'Premium Offline Trip Planner',
        theme_color: '#ffffff',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/mtp-react/',
        scope: '/mtp-react/',
        orientation: 'portrait',
        icons: [
          {
            src: '/mtp-react/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/mtp-react/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}']
      }
    })
  ]
})
