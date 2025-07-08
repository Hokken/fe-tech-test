import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // Changed to jsdom for React component testing
    globals: true, // Enable global test functions (describe, it, expect)
    setupFiles: ['./src/test-setup.ts'], // Setup file for testing library
  },
})