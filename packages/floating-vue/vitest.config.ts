import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      root: fileURLToPath(new URL('./', import.meta.url)),
      // exclude: [
      //   ...configDefaults.exclude,
      //   'e2e/**',
      //   './src/__tests__/useClientPoint.test.tsx',
      //   './src/__tests__/useListNavigation.test.tsx',
      //   './src/__tests__/FloatingList.test.tsx',
      //   './src/__tests__/FloatingFocusManager.test.tsx',
      // ],
      include: [
        './src/core/__tests__/core.test.tsx',
        './src/__tests__/useFloating.test.tsx',
        './src/__tests__/useClick.test.tsx',
        // './src/__tests__/useClientPoint.test.tsx',
        // './src/__tests__/useDismiss.test.tsx',
        // './src/__tests__/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      ],
    // setupFiles: './src/__tests__/setupTests.ts',
    },
  }),
)
