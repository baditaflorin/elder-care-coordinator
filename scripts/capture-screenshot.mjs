import { chromium } from 'playwright'
import { startPagesServer } from './pages-server.mjs'

const server = await startPagesServer()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

try {
  await page.goto(`${server.origin}${server.basePath}`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'docs/screenshot.png', fullPage: true })
} finally {
  await browser.close()
  await server.close()
}
