import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { startPagesServer } from './pages-server.mjs'

const server = await startPagesServer()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto(`${server.origin}${server.basePath}`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Elder Care Coordinator' }).waitFor()
  await page
    .locator('label')
    .filter({ hasText: 'Choose files' })
    .locator('input[type="file"]')
    .setInputFiles(resolve('test/fixtures/realdata/04-prescription-label-sig.txt'))
  await page.getByText('Loaded 1 file').waitFor()
  await page.getByRole('button', { name: 'Review' }).click()
  await page.getByText('Amoxicillin 500 MG', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Apply selected' }).click()
  await page.getByText('Applied 1 candidate').waitFor()
  await page.getByRole('button', { name: 'Medications' }).click()
  await page.getByText('Amoxicillin 500 MG', { exact: true }).waitFor()
  await page.getByLabel('Name').fill('Vitamin D')
  await page.getByLabel('Dose').fill('1000 IU')
  await page.getByRole('button', { name: 'Add medication' }).click()
  await page.getByText('Vitamin D 1000 IU').waitFor()
  await page.getByRole('button', { name: 'Packet' }).click()
  await page.getByText('Emergency Packet:').waitFor()
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByLabel('Default caregiver for imported tasks').selectOption({ index: 1 })
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export workspace JSON' }).click()
  const download = await downloadPromise
  const statePath = await download.path()
  if (!statePath) throw new Error('Workspace export did not produce a local file.')
  await page.getByRole('button', { name: 'Reset workspace to sample' }).click()
  await page.getByText('Reset local workspace').waitFor()
  await page
    .locator('label')
    .filter({ hasText: 'Import workspace JSON' })
    .locator('input[type="file"]')
    .setInputFiles(statePath)
  await page.getByText('Imported workspace').waitFor()
  await page.getByRole('button', { name: 'Medications' }).click()
  await page.getByText('Vitamin D 1000 IU').waitFor()
} finally {
  await browser.close()
  await server.close()
}
