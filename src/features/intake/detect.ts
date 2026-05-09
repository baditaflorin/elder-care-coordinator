import type { DetectedShape } from './types'

export function detectShape(text: string): { shape: DetectedShape; confidence: number; rules: string[] } {
  const lower = text.toLowerCase()
  const rules: string[] = []

  if (!text.trim()) return { shape: 'empty', confidence: 1, rules: ['empty input'] }

  if (/prior authorization|reference id:\s*pa-|step therapy/.test(lower)) {
    rules.push('prior authorization denial terms')
    return { shape: 'prior_authorization', confidence: 0.92, rules }
  }

  if (/medicare summary notice|claim number|denial reason|appeal by|amount charged/.test(lower)) {
    rules.push('insurance denial/MSN terms')
    return { shape: 'insurance_denial', confidence: 0.9, rules }
  }

  if (/reconciliation|discharge medications|stop |start |continue |discontinued/.test(lower)) {
    rules.push('transition or discharge medication vocabulary')
    return { shape: 'discharge_reconciliation', confidence: 0.86, rules }
  }

  if (/^rx\s|\bsig:|prescription directions|quantity:|refills?:|prescriber:/im.test(text)) {
    rules.push('prescription label vocabulary')
    return { shape: 'prescription_sig', confidence: 0.88, rules }
  }

  if (
    /appointment reminder|reply c to confirm|clinic|location:/.test(lower) &&
    /\b\d{1,2}:\d{2}\b|at \d{1,2}/.test(lower)
  ) {
    rules.push('appointment reminder terms and time')
    return { shape: 'appointment', confidence: 0.85, rules }
  }

  const chatLines = text.split('\n').filter((line) => /^[A-Z][A-Za-z]+ \d{1,2}:\d{2}/.test(line))
  if (chatLines.length >= 2) {
    rules.push('speaker plus timestamp chat lines')
    return { shape: 'family_chat', confidence: 0.84, rules }
  }

  if (text.includes('|') || text.includes(',')) {
    const lines = text.split('\n')
    const delimited = lines.filter((line) => line.includes('|') || line.split(',').length >= 3)
    if (delimited.length >= 2 && /medication|strength|dose|sig|how i take/i.test(text)) {
      rules.push('delimited medication rows')
      return { shape: 'medication_list', confidence: 0.82, rules }
    }
    if (delimited.length >= 2) {
      rules.push('delimited rows')
      return { shape: 'csv', confidence: 0.62, rules }
    }
  }

  if (/\b(mg|mcg|iu|units?|tablet|capsule|daily|twice daily|every morning)\b/i.test(text)) {
    rules.push('medication terms without stronger document cue')
    return { shape: 'medication_list', confidence: 0.68, rules }
  }

  return { shape: 'unknown', confidence: 0.25, rules: ['no known care artifact shape matched'] }
}
