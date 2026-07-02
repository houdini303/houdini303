import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Dev proxy: /api/* → lokální Hono proxy (proxy/, port 8787).
// V produkci se /api směruje na nasazenou proxy (doladí se ve Fázi 7).
const PROXY_TARGET = process.env.PROXY_TARGET ?? 'http://localhost:8787';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Houdini303 — MHD Pardubice živě',
        short_name: 'MHD Pardubice',
        description: 'Živá mapa vozů pardubické MHD v reálném čase.',
        theme_color: '#0b0f17',
        background_color: '#0b0f17',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    proxy: {
      '/api': { target: PROXY_TARGET, changeOrigin: true },
    },
  },
});
