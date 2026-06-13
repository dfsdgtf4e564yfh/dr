import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/components/Button.tsx',
        'src/components/Modal.tsx',
        'src/components/Input.tsx',
        'src/components/EmptyState.tsx',
        'src/hooks/useWebSocket.ts',
        'src/hooks/useKeyboardShortcuts.ts',
        'src/utils/jalali.ts',
        'src/pages/Login.tsx',
        'src/pages/Dashboard.tsx',
        'src/pages/Patients.tsx',
      ],
      exclude: [
        'src/main.tsx',
        'src/test/**',
        'src/**/*.test.{js,jsx,ts,tsx}',
        'node_modules',
        'dist',
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 40,
        lines: 65,
      },
    },
  },
})
