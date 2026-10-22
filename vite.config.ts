/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    // The HEIC converter is large but only loads when a browser can't open an iPhone photo itself.
    chunkSizeWarningLimit: 1400,
  },
  test: {
    environment: 'node',
  },
})
