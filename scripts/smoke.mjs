import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, relative } from 'node:path'
import { chromium } from 'playwright'

const basePath = '/elder-care-coordinator/'
const docsRoot = join(process.cwd(), 'docs')

const contentTypes = new Map([
  ['.css', 'text/css;charset=utf-8'],
  ['.html', 'text/html;charset=utf-8'],
  ['.js', 'text/javascript;charset=utf-8'],
  ['.json', 'application/json;charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json'],
])

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1')
  if (!url.pathname.startsWith(basePath)) {
    response.writeHead(404)
    response.end('Not found')
    return
  }

  const relativePath = url.pathname.slice(basePath.length) || 'index.html'
  const normalizedPath = normalize(relativePath.endsWith('/') ? `${relativePath}index.html` : relativePath)
  const filePath = join(docsRoot, normalizedPath)

  if (relative(docsRoot, filePath).startsWith('..')) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  try {
    const body = await readFile(filePath)
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes.get(extname(filePath)) ?? 'application/octet-stream',
    })
    response.end(body)
  } catch {
    const body = await readFile(join(docsRoot, '404.html'))
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html;charset=utf-8',
    })
    response.end(body)
  }
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
if (!address || typeof address === 'string') {
  throw new Error('Unable to start smoke server.')
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto(`http://127.0.0.1:${address.port}${basePath}`, { waitUntil: 'networkidle' })
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
  await new Promise((resolve) => server.close(resolve))
}
