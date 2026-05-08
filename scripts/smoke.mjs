import { chromium } from 'playwright'
import { startPagesServer } from './pages-server.mjs'

const server = await startPagesServer()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto(`${server.origin}${server.basePath}`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Elder Care Coordinator' }).waitFor()
  await page.getByRole('button', { name: 'Medications' }).click()
  await page.getByLabel('Name').fill('Vitamin D')
  await page.getByLabel('Dose').fill('1000 IU')
  await page.getByRole('button', { name: 'Add medication' }).click()
  await page.getByText('Vitamin D 1000 IU').waitFor()
  await page.getByRole('button', { name: 'Packet' }).click()
  await page.getByText('Emergency Packet:').waitFor()
} finally {
  await browser.close()
  await server.close()
}
