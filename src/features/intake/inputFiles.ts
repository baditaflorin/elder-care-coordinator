export type CareInputFormat = 'auto' | 'csv' | 'html' | 'json' | 'markdown' | 'state' | 'text' | 'url'

export const selectableCareInputFormats: CareInputFormat[] = [
  'auto',
  'csv',
  'html',
  'json',
  'markdown',
  'text',
]

export function parseCareInputFormat(value: string): CareInputFormat {
  switch (value) {
    case 'auto':
    case 'csv':
    case 'html':
    case 'json':
    case 'markdown':
    case 'text':
      return value
    default:
      return 'auto'
  }
}

export type ReadCareFile = {
  format: CareInputFormat
  name: string
  size: number
  text: string
}

export const sampleCareArtifact = `Medication reconciliation at transition of care
Home medications:
Warfarin 5 mg by mouth daily. Last dose yesterday evening.
Metformin 500 mg by mouth twice daily with meals.
Discharge medications:
STOP Warfarin.
START Apixaban 5 mg by mouth twice daily.
CONTINUE Metformin 500 mg by mouth twice daily with meals.`

export async function readCareInputFiles(files: FileList | File[]) {
  const fileArray = Array.from(files)
  const outputs: ReadCareFile[] = []
  for (const file of fileArray) {
    const text = await file.text()
    outputs.push({
      format: detectCareInputFormat(file.name, text),
      name: file.name,
      size: file.size,
      text,
    })
  }
  return outputs
}

export function combineCareFiles(files: ReadCareFile[]) {
  return files
    .map((file) => [`Source file: ${file.name}`, prepareCareArtifactText(file.text, file.format)].join('\n'))
    .join('\n\n---\n\n')
}

export function detectCareInputFormat(filename: string, text: string): CareInputFormat {
  const lowerName = filename.toLowerCase()
  const trimmed = text.trim()
  if (/^https?:\/\//i.test(trimmed)) return 'url'
  if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || /<\/?[a-z][\s\S]*>/i.test(trimmed))
    return 'html'
  if (lowerName.endsWith('.json') || trimmed.startsWith('{')) {
    return trimmed.includes('"schemaVersion"') && trimmed.includes('elder-care-state.v1') ? 'state' : 'json'
  }
  if (lowerName.endsWith('.csv') || looksLikeCsv(trimmed)) return 'csv'
  if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) return 'markdown'
  return 'text'
}

export function prepareCareArtifactText(text: string, format: CareInputFormat) {
  const detected = format === 'auto' ? detectCareInputFormat('', text) : format
  if (detected === 'url') {
    throw new Error(
      'GitHub Pages cannot fetch private portal URLs. Paste the rendered text or upload a downloaded file.',
    )
  }
  if (detected === 'html') return htmlToText(text)
  if (detected === 'json') return jsonToText(text)
  return text
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function jsonToText(text: string) {
  try {
    const parsed = JSON.parse(text) as unknown
    return flattenJson(parsed).join('\n')
  } catch {
    throw new Error(
      'This JSON could not be read as care text. Use a workspace import for exported state files.',
    )
  }
}

function flattenJson(value: unknown): string[] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return [String(value)]
  if (Array.isArray(value)) return value.flatMap(flattenJson)
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(flattenJson)
  return []
}

function looksLikeCsv(text: string) {
  const lines = text.split('\n').filter(Boolean)
  return lines.length > 1 && lines.slice(0, 3).every((line) => line.split(',').length >= 3)
}
