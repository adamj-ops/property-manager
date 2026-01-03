import path from 'path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'happy-dom',

    // Global test APIs (describe, it, expect)
    globals: true,

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.output',
      'tests/e2e/**/*',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/types/**',
        '.output/**',
        'dist/**',
        'prisma/**',
        'supabase/**',
        'scripts/**',
        'src/route-tree.gen.ts',
        'src/entry-*.{ts,tsx}',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },

    // Test timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter
    reporters: ['default'],

    // Use threads pool (default in Vitest 4)
    pool: 'threads',

    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
})

