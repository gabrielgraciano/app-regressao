import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Crítico para o GitHub Pages: o site é servido em
  // https://gabrielgraciano.github.io/app-regressao/
  base: '/app-regressao/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
