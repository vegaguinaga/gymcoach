import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Configuración de Vite (build) y Vitest (tests) en un solo archivo
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Los tests de lógica pura no necesitan navegador
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
