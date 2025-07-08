import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node', // We're testing utility functions, not React components
    globals: true, // Enable global test functions (describe, it, expect)
  },
})