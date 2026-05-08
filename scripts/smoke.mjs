import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto('http://127.0.0.1:4173/elder-care-coordinator/', { waitUntil: 'networkidle' })
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
}
