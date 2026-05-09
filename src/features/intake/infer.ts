import { buildInsuranceDraft } from '../care-plan/planner'
import { sampleCarePlan } from '../care-plan/sample'
import { byteLength, largeInputWarningBytes, maxInputBytes, normalizeCareText } from './normalize'
import { clampConfidence, confidenceLevel, warning } from './confidence'
import { detectShape } from './detect'
import { stableHash, stableId } from './hash'
import { intakeResultSchema, type IntakeCandidate, type IntakeResult, type IntakeWarning } from './types'

const cache = new Map<string, IntakeResult>()

const medicationTerms =
  /\b(mg|mcg|g|iu|unit|units|tablet|tablets|capsule|capsules|daily|twice daily|three times daily|every morning|every evening|by mouth|sig:)\b/i

const monthNumber: Record<string, string> = {
  april: '04',
  aug: '08',
  august: '08',
  dec: '12',
  december: '12',
  feb: '02',
  february: '02',
  jan: '01',
  january: '01',
  jul: '07',
  july: '07',
  jun: '06',
  june: '06',
  mar: '03',
  march: '03',
  may: '05',
  nov: '11',
  november: '11',
  oct: '10',
  october: '10',
  sep: '09',
  september: '09',
}

export async function analyzeCareInput(rawInput: string, signal?: AbortSignal): Promise<IntakeResult> {
  if (signal?.aborted) throw new DOMException('Analysis cancelled.', 'AbortError')

  const normalizedText = normalizeCareText(rawInput)
  const sourceBytes = byteLength(rawInput)
  const sourceHash = stableHash(normalizedText)
  const cacheKey = `${sourceHash}:${sourceBytes}`
  const cached = cache.get(cacheKey)
  if (cached) return structuredClone(cached)

  await Promise.resolve()
  if (signal?.aborted) throw new DOMException('Analysis cancelled.', 'AbortError')

  const detected = detectShape(normalizedText)
  const warnings: IntakeWarning[] = []
  if (!normalizedText) {
    warnings.push(
      warning(
        'empty-input',
        'No care details were found in the pasted text.',
        'Paste a medication list, denial letter, appointment reminder, or family handoff.',
        'error',
      ),
    )
  }
  if (sourceBytes > largeInputWarningBytes) {
    warnings.push(
      warning(
        'large-input',
        'This care document is large and may need chunked review.',
        'Paste the medication, appointment, denial, or handoff section first.',
        'warning',
      ),
    )
  }
  if (sourceBytes > maxInputBytes) {
    warnings.push(
      warning(
        'too-large',
        'This pasted care document is larger than v0.2.0 can safely review in one pass.',
        'Split the document by section and analyze one section at a time.',
        'error',
      ),
    )
  }

  const lines = normalizedText.split('\n')
  const candidates =
    sourceBytes > maxInputBytes
      ? []
      : [
          ...inferMedications(lines, detected.shape),
          ...inferInsurance(normalizedText),
          ...inferAppointment(normalizedText),
          ...inferFamilyChat(lines),
        ]

  const duplicateWarnings = medicationConflictWarnings(candidates)
  warnings.push(...duplicateWarnings)

  if (candidates.length === 0 && normalizedText) {
    warnings.push(
      warning(
        'no-candidates',
        'The text did not contain a medication, appointment, denial, or family handoff I can identify with confidence.',
        'Keep the original text and add the item manually, or paste a more complete section.',
        'needs_clarification',
      ),
    )
  }

  const confidence = clampConfidence(
    candidates.length ? average(candidates.map((candidate) => candidate.confidence)) : detected.confidence,
  )

  const result = intakeResultSchema.parse({
    schemaVersion: 'intake.v1',
    sourceHash,
    sourceBytes,
    normalizedText,
    detectedShape: detected.shape,
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    candidates: stableCandidates(candidates),
    warnings,
    debug: {
      parser: 'rule-based-care-intake-v1',
      lineCount: normalizedText ? lines.length : 0,
      rules: detected.rules,
    },
  })

  cache.set(cacheKey, structuredClone(result))
  return result
}

function inferMedications(lines: string[], shape: string): IntakeCandidate[] {
  const candidates: IntakeCandidate[] = []
  let section: 'discharge' | 'home' | '' = ''

  lines.forEach((line, index) => {
    if (/^home medications:?$/i.test(line)) {
      section = 'home'
      return
    }
    if (/^discharge medications:?$/i.test(line)) {
      section = 'discharge'
      return
    }

    const sourceLines = [index + 1]
    const nextLine = lines[index + 1] ?? ''
    const sourceText =
      medicationTerms.test(line) && isMedicationContinuation(nextLine) ? `${line} ${nextLine}` : line
    if (sourceText !== line) sourceLines.push(index + 2)

    const lower = sourceText.toLowerCase()
    const actionLine = /^(stop|start|continue|discontinued|new:|new discharge order:)/i.test(line)
    if (!medicationTerms.test(sourceText) && !actionLine) return
    if (/provider:|service date:|amount charged:|appeal by:|location:|reply c/.test(lower)) return
    if (/medication\s*\||strength\s*\||how i take/i.test(sourceText)) return

    const parts = sourceText.includes('|') ? sourceText.split('|').map((part) => part.trim()) : []
    const action = /^(stop|discontinued)/i.test(line)
      ? 'stop'
      : /^(start|new:)/i.test(line)
        ? 'start'
        : /^continue/i.test(line)
          ? 'continue'
          : /before admission|home medications/i.test(line) || section === 'home'
            ? 'home'
            : ''

    const parsed = parts.length >= 3 ? parseDelimitedMedication(parts) : parseMedicationLine(sourceText)
    if (!parsed.name || (!parsed.dose && action !== 'stop')) return

    const schedule = inferSchedule(sourceText)
    const warnings: IntakeWarning[] = []
    if (action === 'stop') {
      warnings.push(
        warning(
          'stopped-medication',
          `${parsed.name} appears to be a stopped medication.`,
          'Do not add it as active unless the current clinician confirmed it.',
          'needs_clarification',
        ),
      )
    }
    if (schedule.ambiguous) {
      warnings.push(
        warning(
          'ambiguous-direction',
          `Ambiguous directions: ${parsed.name} has directions that could map to more than one schedule and needs clarification.`,
          'Confirm the schedule with the bottle, pharmacy, or prescriber before relying on it.',
          'needs_clarification',
        ),
      )
    }
    if (action === 'home') {
      warnings.push(
        warning(
          'transition-medication',
          `${parsed.name} came from a transition or home-medication section.`,
          'Compare it with discharge/start/stop instructions before applying.',
          'warning',
        ),
      )
    }

    const confidence = clampConfidence(
      0.48 +
        (parsed.name ? 0.16 : 0) +
        (parsed.dose ? 0.14 : 0) +
        (schedule.times.length ? 0.14 : 0) +
        (parts.length >= 3 ? 0.08 : 0) -
        (warnings.some((item) => item.severity === 'needs_clarification') ? 0.2 : 0),
    )

    candidates.push({
      id: stableId('med', [parsed.name, parsed.dose, schedule.times.join(','), action, sourceText]),
      type: 'medication',
      title: `${parsed.name} ${parsed.dose}`.trim(),
      confidence,
      confidenceLevel: confidenceLevel(confidence),
      sourceText,
      sourceLines,
      fields: {
        action,
        dose: parsed.dose,
        frequency: schedule.frequency,
        instructions: parsed.instructions || line,
        name: parsed.name,
        purpose: parsed.purpose,
        refillBy: parsed.refillBy,
        times: schedule.times,
      },
      warnings,
      explanation: [
        parsed.dose
          ? `Detected as medication because the line contains ${parsed.dose} and medication direction vocabulary.`
          : 'Detected as medication because the line uses start/stop/continue medication vocabulary.',
        schedule.explanation,
        shape === 'discharge_reconciliation' ? 'Document shape suggests transition-of-care review.' : '',
      ].filter(Boolean),
    })
  })

  return candidates
}

function isMedicationContinuation(line: string) {
  return /^(take|sig:|directions?:)|\bby mouth\b|\bas needed\b|\bdaily\b|\btwice daily\b/i.test(line.trim())
}

function parseDelimitedMedication(parts: string[]) {
  return {
    dose: parts[1] ?? '',
    instructions: parts[2] ?? '',
    name: parts[0] ?? '',
    purpose: parts[3] ?? '',
    refillBy: findDate(parts.join(' ')) ?? '',
  }
}

function parseMedicationLine(line: string) {
  const cleaned = line
    .replace(
      /^(home medications:|discharge medications:|before admission:|new discharge order:|new:|start|stop|continue|discontinued:)/i,
      '',
    )
    .replace(/^sig:\s*/i, '')
    .trim()
  const match = cleaned.match(
    /([A-Z][A-Za-z-]+(?:\s[A-Z][A-Za-z-]+)?)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|iu|units?|MG)(?:\s(?:tablet|tablets|capsule|capsules))?)/,
  )
  if (match) {
    return {
      dose: match[2] ?? '',
      instructions: cleaned,
      name: (match[1] ?? '').replace(/Rx\s+\d+/i, '').trim(),
      purpose: '',
      refillBy: findDate(cleaned) ?? '',
    }
  }

  const rxName = cleaned.match(/^([A-Z][A-Za-z-]+)\s+(\d+(?:\.\d+)?\s*MG)/i)
  return {
    dose: rxName?.[2] ?? '',
    instructions: cleaned,
    name: rxName?.[1] ?? cleaned.match(/^([A-Z][A-Za-z-]+)/)?.[1] ?? '',
    purpose: '',
    refillBy: findDate(cleaned) ?? '',
  }
}

function inferSchedule(text: string) {
  const lower = text.toLowerCase()
  if (/twice daily|\bbid\b/.test(lower) && /(daily).*(twice daily)|twice daily.*as needed/.test(lower)) {
    return {
      ambiguous: true,
      explanation: 'Contains conflicting daily/twice-daily or as-needed wording.',
      frequency: 'as_needed',
      times: ['08:00', '20:00'],
    }
  }
  if (/three times daily|\btid\b/.test(lower)) {
    return {
      ambiguous: false,
      explanation: 'Three-times-daily direction mapped to morning, afternoon, and evening review times.',
      frequency: 'daily',
      times: ['08:00', '14:00', '20:00'],
    }
  }
  if (/twice daily|\bbid\b/.test(lower)) {
    return {
      ambiguous: false,
      explanation: 'Twice-daily direction mapped to 08:00 and 20:00.',
      frequency: 'twice_daily',
      times: ['08:00', '20:00'],
    }
  }
  if (/every evening|night|bedtime/.test(lower)) {
    return {
      ambiguous: false,
      explanation: 'Evening direction mapped to 20:00.',
      frequency: 'daily',
      times: ['20:00'],
    }
  }
  if (/every morning|breakfast/.test(lower)) {
    return {
      ambiguous: false,
      explanation: 'Morning direction mapped to 08:00.',
      frequency: 'daily',
      times: ['08:00'],
    }
  }
  if (/as needed|\bprn\b/.test(lower)) {
    return {
      ambiguous: true,
      explanation: 'As-needed medication should not become a fixed schedule without clarification.',
      frequency: 'as_needed',
      times: [],
    }
  }
  if (/once daily|daily/.test(lower)) {
    return {
      ambiguous: false,
      explanation: 'Daily direction mapped to 09:00 because no time of day was given.',
      frequency: 'daily',
      times: ['09:00'],
    }
  }
  return {
    ambiguous: false,
    explanation: 'No explicit schedule found.',
    frequency: 'daily',
    times: [],
  }
}

function inferInsurance(text: string): IntakeCandidate[] {
  const lower = text.toLowerCase()
  if (!/denial|appeal|medicare summary notice|prior authorization|claim number|reference id/.test(lower))
    return []

  const isPriorAuth = /prior authorization|reference id:\s*pa-|step therapy/.test(lower)
  const reference = firstMatch(text, /(?:claim number|reference id):\s*([A-Z0-9-]+)/i)
  const service = firstMatch(text, /(?:item|service|medication):\s*([^\n]+)/i)
  const denialReason = firstMatch(text, /(?:reason|denial reason|denied because):\s*([^\n]+)/i)
  const policy = firstMatch(text, /(?:policy|member id):\s*([A-Z0-9-]+)/i)
  const appealBy = firstMatch(text, /appeal by:\s*([^\n]+)/i)
  const needsDocs = /supporting|chart notes|medical records|medication history/.test(lower)
  const warnings: IntakeWarning[] = []

  if (needsDocs) {
    warnings.push(
      warning(
        'supporting-document',
        'The denial mentions supporting documents.',
        'Attach chart notes, medication history, or prescriber documentation before sending.',
        'warning',
      ),
    )
  }
  if (!reference) {
    warnings.push(
      warning(
        'missing-reference',
        'No claim or reference number was found.',
        'Find the claim number, reference ID, or denial ID before sending an appeal.',
        'needs_clarification',
      ),
    )
  }

  const facts = [
    reference ? `Reference: ${reference}` : '',
    service ? `Service or medication: ${service}` : '',
    denialReason ? `Denial reason: ${denialReason}` : '',
    appealBy ? `Appeal deadline: ${appealBy}` : '',
    policy ? `Policy: ${policy}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const confidence = clampConfidence(
    0.5 + (reference ? 0.15 : 0) + (service ? 0.15 : 0) + (denialReason ? 0.15 : 0),
  )
  const candidate: IntakeCandidate = {
    id: stableId('corr', [reference, service, denialReason, isPriorAuth]),
    type: 'correspondence',
    title: isPriorAuth ? 'Prior authorization appeal draft' : 'Insurance appeal draft',
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    sourceText: text,
    sourceLines: [1],
    fields: {
      appealBy: appealBy ?? '',
      denialReason: denialReason ?? '',
      draft: buildInsuranceDraft(
        sampleCarePlan,
        isPriorAuth ? 'prior_authorization' : 'coverage_appeal',
        facts || text.slice(0, 500),
      ),
      facts,
      policy: policy ?? '',
      recipient: isPriorAuth
        ? 'Health plan prior authorization department'
        : 'Health plan appeals department',
      reference: reference ?? '',
      service: service ?? '',
      topic: isPriorAuth ? 'prior_authorization' : 'coverage_appeal',
    },
    warnings,
    explanation: [
      isPriorAuth
        ? 'Detected as prior authorization because the text mentions prior authorization, reference ID, or step therapy.'
        : 'Detected as insurance denial because the text contains denial, appeal, claim, or Medicare Summary Notice terms.',
    ],
  }

  const candidates = [candidate]
  if (needsDocs) {
    candidates.push({
      id: stableId('task', [reference, 'supporting-documents']),
      type: 'task',
      title: 'Gather supporting appeal documents',
      confidence: 0.82,
      confidenceLevel: 'high',
      sourceText: text,
      sourceLines: [1],
      fields: {
        dueDate: appealBy ? normalizeDate(appealBy) : '',
        ownerHint: 'finance',
        status: 'open',
        title: 'Gather supporting medical records for appeal',
      },
      warnings: [
        warnings.find((item) => item.code === 'supporting-document') ??
          warning('supporting-document', '', ''),
      ],
      explanation: ['Created because the denial asks for supporting records or chart notes.'],
    })
  }
  return candidates
}

function inferAppointment(text: string): IntakeCandidate[] {
  const lower = text.toLowerCase()
  if (!/appointment|clinic|location:|reply c to confirm|cardiology/.test(lower)) return []
  if (!/\d{1,2}:\d{2}|at \d{1,2}/.test(lower)) return []

  const clinician =
    firstMatch(text, /^(.*Clinic)$/im) ??
    firstMatch(text, /(Cardiology Clinic|Family Clinic|Lab draw)/i) ??
    'Appointment'
  const location = firstMatch(text, /location:\s*([^\n]+)/i) ?? ''
  const prep = firstMatch(text, /(bring [^\n]+)/i) ?? ''
  const dateText = firstMatch(
    text,
    /((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?\s*[A-Za-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2}\s*(?:AM|PM)?(?: [A-Za-z]+ Time)?)/i,
  )
  const dateTime = dateText ? normalizeDateTime(dateText) : ''
  const warnings: IntakeWarning[] = []
  if (/eastern|central|mountain|pacific|time zone| time\b/i.test(text)) {
    warnings.push(
      warning(
        'timezone',
        'The appointment includes timezone wording.',
        'Confirm the appointment time in the caregiver or clinic timezone before relying on reminders.',
        'warning',
      ),
    )
  }

  const confidence = clampConfidence(
    0.5 + (clinician ? 0.12 : 0) + (location ? 0.12 : 0) + (dateTime ? 0.18 : 0),
  )
  return [
    {
      id: stableId('appt', [clinician, location, dateTime]),
      type: 'appointment',
      title: clinician,
      confidence,
      confidenceLevel: confidenceLevel(confidence),
      sourceText: text,
      sourceLines: [1],
      fields: {
        clinician,
        dateTime,
        followUp: '',
        location,
        preparation: prep,
        reason: prep || 'Appointment reminder',
        timezone: /eastern/i.test(text) ? 'Eastern Time' : '',
      },
      warnings,
      explanation: ['Detected appointment reminder terms plus a date/time and location cue.'],
    },
  ]
}

function inferFamilyChat(lines: string[]): IntakeCandidate[] {
  const chatLines = lines
    .map((line, index) => ({
      index,
      line,
      match: line.match(/^([A-Z][A-Za-z]+)\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?):\s*(.+)$/i),
    }))
    .filter((item) => item.match)

  if (chatLines.length < 2) return []

  const candidates: IntakeCandidate[] = []
  for (const item of chatLines) {
    const speaker = item.match?.[1] ?? 'Caregiver'
    const body = item.match?.[3] ?? item.line
    const lower = body.toLowerCase()
    const med = firstMatch(body, /\b(Metformin|Lisinopril|Apixaban|Warfarin|Gabapentin|Amoxicillin)\b/i)

    if (med && /taken|needs confirmation|missed|skipped/.test(lower)) {
      candidates.push({
        id: stableId('confirm', [speaker, med, body]),
        type: 'medication_confirmation',
        title: `${med} handoff`,
        confidence: /taken/.test(lower) ? 0.86 : 0.72,
        confidenceLevel: /taken/.test(lower) ? 'high' : 'medium',
        sourceText: item.line,
        sourceLines: [item.index + 1],
        fields: {
          caregiver: speaker,
          medicationName: med,
          status: /taken/.test(lower) ? 'taken' : 'needs_confirmation',
          text: body,
        },
        warnings: /needs confirmation/.test(lower)
          ? [
              warning(
                'needs-confirmation',
                `${med} still needs a caregiver confirmation.`,
                'Confirm the dose before marking it done.',
                'needs_clarification',
              ),
            ]
          : [],
        explanation: [
          'Detected medication name plus taken/missed/confirmation language in a family handoff.',
        ],
      })
    }

    if (
      /drive|appointment|clinic|cardiology/.test(lower) &&
      /\d{1,2}:\d{2}|\b\d{1,2}:\d{2}\b|at \d{1,2}/.test(lower)
    ) {
      candidates.push({
        id: stableId('appt', [speaker, body]),
        type: 'appointment',
        title: 'Appointment transport handoff',
        confidence: 0.62,
        confidenceLevel: 'medium',
        sourceText: item.line,
        sourceLines: [item.index + 1],
        fields: {
          clinician: /cardiology/.test(lower) ? 'Cardiology clinic' : 'Appointment',
          dateTime: '',
          followUp: '',
          location: '',
          preparation: body,
          reason: 'Family transport handoff',
          transportOwner: speaker,
        },
        warnings: [
          warning(
            'partial-appointment',
            'This chat mentions an appointment but not enough calendar details.',
            'Confirm the date, time, and clinic location before adding it to the schedule.',
            'warning',
          ),
        ],
        explanation: ['Detected transport/appointment language in a family chat message.'],
      })
    }

    if (/please|need|call|add|send|request/.test(lower)) {
      candidates.push({
        id: stableId('task', [speaker, body]),
        type: 'task',
        title: body.replace(/^please\s+/i, ''),
        confidence: 0.76,
        confidenceLevel: 'medium',
        sourceText: item.line,
        sourceLines: [item.index + 1],
        fields: {
          ownerHint: speaker,
          status: 'open',
          title: body.replace(/^please\s+/i, ''),
        },
        warnings: [],
        explanation: ['Detected caregiver request language that should become a task.'],
      })
    }

    candidates.push({
      id: stableId('note', [speaker, body]),
      type: 'note',
      title: `${speaker} note`,
      confidence: 0.66,
      confidenceLevel: 'medium',
      sourceText: item.line,
      sourceLines: [item.index + 1],
      fields: {
        authorHint: speaker,
        body,
      },
      warnings: [],
      explanation: ['Preserved original chat line as a family note candidate.'],
    })
  }

  return candidates
}

function medicationConflictWarnings(candidates: IntakeCandidate[]) {
  const warnings: IntakeWarning[] = []
  const byName = new Map<string, Set<string>>()
  for (const candidate of candidates) {
    if (candidate.type !== 'medication') continue
    const name = String(candidate.fields.name ?? '').toLowerCase()
    const dose = String(candidate.fields.dose ?? '').toLowerCase()
    if (!name) continue
    byName.set(name, byName.get(name) ?? new Set())
    byName.get(name)?.add(dose)
  }
  for (const [name, doses] of byName.entries()) {
    if (doses.size > 1) {
      warnings.push(
        warning(
          'dose-changed',
          `Dose changed: ${titleCase(name)} appears with more than one dose.`,
          'Review the discharge/current order and keep only the active dose.',
          'needs_clarification',
        ),
      )
    }
  }
  if (candidates.some((candidate) => candidate.warnings.some((item) => item.code === 'stopped-medication'))) {
    warnings.push(
      warning(
        'discontinued',
        'One or more medications appear stopped or discontinued.',
        'Do not include stopped medications as active in the emergency packet.',
        'needs_clarification',
      ),
    )
  }
  if (
    candidates.some((candidate) => candidate.warnings.some((item) => item.code === 'transition-medication'))
  ) {
    warnings.push(
      warning(
        'transition',
        'This input includes transition-of-care medication context.',
        'Compare home, start, stop, and continue sections before applying.',
        'warning',
      ),
    )
  }
  return warnings
}

function stableCandidates(candidates: IntakeCandidate[]) {
  return candidates
    .slice()
    .sort((a, b) => `${a.type}:${a.title}:${a.id}`.localeCompare(`${b.type}:${b.title}:${b.id}`))
}

function firstMatch(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim()
}

function findDate(text: string) {
  return firstMatch(text, /\b(\d{4}-\d{2}-\d{2})\b/) ?? firstMatch(text, /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/)
}

function normalizeDate(text: string) {
  const slash = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slash) return `${slash[3]}-${slash[1]?.padStart(2, '0')}-${slash[2]?.padStart(2, '0')}`
  const named = text.toLowerCase().match(/([a-z]+)\s+(\d{1,2}),\s*(\d{4})/)
  if (named) return `${named[3]}-${monthNumber[named[1] ?? ''] ?? '01'}-${named[2]?.padStart(2, '0')}`
  return text
}

function normalizeDateTime(text: string) {
  const match = text
    .toLowerCase()
    .match(
      /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)?\s*([a-z]+)\s+(\d{1,2}),\s*(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*(am|pm)?/,
    )
  if (!match) return ''
  let hour = Number(match[4])
  const minute = match[5] ?? '00'
  if (match[6] === 'pm' && hour < 12) hour += 12
  if (match[6] === 'am' && hour === 12) hour = 0
  return `${match[3]}-${monthNumber[match[1] ?? ''] ?? '01'}-${match[2]?.padStart(2, '0')}T${String(hour).padStart(2, '0')}:${minute}:00`
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}
