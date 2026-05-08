import { rmSync } from 'node:fs'

const generatedPaths = [
  'docs/assets',
  'docs/404.html',
  'docs/favicon.svg',
  'docs/index.html',
  'docs/manifest.webmanifest',
  'docs/registerSW.js',
  'docs/sw.js',
  'docs/workbox-9c191d2f.js',
]

for (const path of generatedPaths) {
  rmSync(path, { force: true, recursive: true })
}
