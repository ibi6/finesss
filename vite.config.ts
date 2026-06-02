import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/finesss/' : undefined,
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/.deploy-stage/**', '**/.playwright-mcp/**'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/tests/**/*.test.{ts,tsx}', 'server/tests/**/*.test.mjs'],
    exclude: ['.deploy-stage/**', 'peakfuel-scaffold/**'],
    setupFiles: './src/tests/setup.ts',
  },
})
