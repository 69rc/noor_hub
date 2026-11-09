import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'images/*.svg', 'favicon.svg'],
      manifest: {
        id: '/',
        name: 'Noor Hub — Quran & Daily Worship',
        short_name: 'Noor Hub',
        description: 'A peaceful companion for Quran, prayer, Arabic learning, and daily worship.',
        theme_color: '#174b3a',
        background_color: '#faf9f4',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['education', 'lifestyle', 'books'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      devOptions: { enabled: false }
    })
  ],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } } },
  preview: { port: 4173, proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } } },
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.js'], css: false }
});