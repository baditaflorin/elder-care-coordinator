import type { CarePlan } from '../care-plan/types'
import type { IntakeCandidate, IntakeResult } from './types'

type ApplyIntakeOptions = {
  defaultCaregiverId?: string
}

export function applyIntakeResult(
  plan: CarePlan,
  result: IntakeResult,
  candidateIds: string[],
  options: ApplyIntakeOptions = {},
) {
  const selected = new Set(candidateIds)
  const draft = structuredClone(plan)
  const now = new Date().toISOString()

  for (const candidate of result.candidates.filter((item) => selected.has(item.id))) {
    applyCandidate(draft, candidate, now, result.sourceHash, options)
  }

  draft.updatedAt = now
  draft.activityLog.unshift({
    at: now,
    id: `activity_${result.sourceHash}_${draft.activityLog.length}`,
    kind: 'intake_applied',
    sourceId: result.sourceHash,
    summary: `Applied ${selected.size} intake candidate${selected.size === 1 ? '' : 's'} from ${result.detectedShape}.`,
  })

  return draft
}

function applyCandidate(
  plan: CarePlan,
  candidate: IntakeCandidate,
  now: string,
  sourceHash: string,
  options: ApplyIntakeOptions,
) {
  const ownerId = options.defaultCaregiverId || plan.caregivers[0]?.id || ''

  if (candidate.type === 'medication') {
    const action = String(candidate.fields.action ?? '')
    if (action === 'stop') return
    const exists = plan.medications.some((medication) => medication.id === candidate.id)
    if (exists) return
    plan.medications.push({
      id: candidate.id,
      confirmedBy: undefined,
      dose: String(candidate.fields.dose ?? ''),
      frequency: normalizeFrequency(String(candidate.fields.frequency ?? 'daily')),
      instructions: String(candidate.fields.instructions ?? candidate.sourceText),
      lastConfirmedAt: undefined,
      name: String(candidate.fields.name ?? candidate.title),
      prescriber: '',
      purpose: String(candidate.fields.purpose ?? ''),
      refillBy: String(candidate.fields.refillBy ?? '') || now.slice(0, 10),
      times: Array.isArray(candidate.fields.times) ? candidate.fields.times.map(String) : [],
    })
  }

  if (candidate.type === 'appointment') {
    if (plan.appointments.some((appointment) => appointment.id === candidate.id)) return
    plan.appointments.push({
      id: candidate.id,
      clinician: String(candidate.fields.clinician ?? candidate.title),
      dateTime: String(candidate.fields.dateTime ?? '') || now,
      followUp: String(candidate.fields.followUp ?? ''),
      location: String(candidate.fields.location ?? ''),
      preparation: String(candidate.fields.preparation ?? candidate.sourceText),
      reason: String(candidate.fields.reason ?? candidate.title),
      transportOwnerId: ownerId,
    })
  }

  if (candidate.type === 'correspondence') {
    if (plan.correspondence.some((entry) => entry.id === candidate.id)) return
    plan.correspondence.push({
      id: candidate.id,
      draft: String(candidate.fields.draft ?? ''),
      facts: String(candidate.fields.facts ?? candidate.sourceText),
      recipient: String(candidate.fields.recipient ?? 'Health plan appeals department'),
      topic: normalizeTopic(String(candidate.fields.topic ?? 'coverage_appeal')),
      updatedAt: now,
    })
  }

  if (candidate.type === 'task') {
    if (plan.tasks.some((task) => task.id === candidate.id)) return
    plan.tasks.push({
      id: candidate.id,
      dueDate: String(candidate.fields.dueDate ?? '') || now.slice(0, 10),
      ownerId,
      status: 'open',
      title: String(candidate.fields.title ?? candidate.title),
    })
  }

  if (candidate.type === 'note') {
    if (plan.notes.some((note) => note.id === candidate.id)) return
    plan.notes.unshift({
      id: candidate.id,
      authorId: ownerId,
      body: String(candidate.fields.body ?? candidate.sourceText),
      createdAt: now,
    })
  }

  if (candidate.type === 'medication_confirmation') {
    const medicationName = String(candidate.fields.medicationName ?? '').toLowerCase()
    const medication = plan.medications.find((item) => item.name.toLowerCase() === medicationName)
    if (medication && candidate.fields.status === 'taken') {
      medication.lastConfirmedAt = now
      medication.confirmedBy = ownerId
    } else {
      plan.notes.unshift({
        id: `note_${sourceHash}_${candidate.id}`,
        authorId: ownerId,
        body: candidate.sourceText,
        createdAt: now,
      })
    }
  }
}

function normalizeFrequency(value: string) {
  if (value === 'twice_daily' || value === 'weekly' || value === 'as_needed') return value
  return 'daily'
}

function normalizeTopic(value: string) {
  if (value === 'prior_authorization' || value === 'billing_dispute' || value === 'care_summary') return value
  return 'coverage_appeal'
}
