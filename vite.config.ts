import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as {
  version: string
}

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'dev'
  }
}

export default defineConfig({
  base: '/elder-care-coordinator/',
  build: {
    target: 'esnext',
    outDir: 'docs',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@duckdb/duckdb-wasm')) return 'duckdb'
          if (id.includes('libsodium') || id.includes('age-encryption')) return 'crypto'
          if (id.includes('pandoc-wasm')) return 'pandoc'
          if (id.includes('@huggingface/transformers')) return 'whisper'
          if (id.includes('@mlc-ai/web-llm')) return 'local-llm'
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_COMMIT__: JSON.stringify(gitCommit()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Elder Care Coordinator',
        short_name: 'Care Coordinator',
        description:
          'Local-first elder care coordination for medication, appointments, correspondence, and emergency packets.',
        theme_color: '#135e75',
        background_color: '#f7f4ee',
        display: 'standalone',
        scope: '/elder-care-coordinator/',
        start_url: '/elder-care-coordinator/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/elder-care-coordinator/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,json,wasm}'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
      },
    }),
  ],
})
