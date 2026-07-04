import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Vlastní PWA ovládající chytrou domácnost přes Home Assistant WebSocket API.
// Připojení (URL + token) se nastavuje v appce (⚙️) nebo přes .env (viz .env.example).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Domácnost',
        short_name: 'Domácnost',
        description: 'Ovládání chytré domácnosti (Home Assistant).',
        theme_color: '#0b0f17',
        background_color: '#0b0f17',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
