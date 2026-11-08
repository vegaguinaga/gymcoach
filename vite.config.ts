import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// Ruta base: '/' en local; en GitHub Pages la app vive en /gymcoach/ (BASE_PATH lo fija el workflow)
const base = process.env.BASE_PATH ?? '/'

// Configuración de Vite (build) y Vitest (tests) en un solo archivo
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    // PWA: instalable y 100 % offline. 'prompt' = no recarga sola en medio de una sesión;
    // se muestra un aviso para actualizar cuando el usuario quiera.
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'GymCoach',
        short_name: 'GymCoach',
        description: 'Tu entrenador de gym: rutinas, registro y progreso.',
        lang: 'es',
        // id y scope fijos: el navegador reconoce la misma app aunque cambie start_url
        id: base,
        scope: base,
        categories: ['health', 'fitness', 'sports'],
        start_url: `${base}#/entrenar`,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache de todo: JS (incluido el chunk diferido de Progreso), CSS, HTML, iconos y fotos
        globPatterns: ['**/*.{js,css,html,svg,png,webp,json}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    // Los tests de lógica pura no necesitan navegador
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
