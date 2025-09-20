import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(() => {
  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', '.next'],
      env: {
        // Make environment variables available to tests
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      coverage: {
        provider: 'v8' as const,
        reporter: ['text', 'json-summary', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          'dist/',
          '.next/'
        ]
      },
      // Performance testing capabilities
      testTimeout: 10000,
      // For performance assertions
      expect: {
        // Custom matchers for performance testing
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})