import type { CarePlan, CorrespondenceTopic, Medication } from './types'

export type DueDose = {
  medicationId: string
  medicationName: string
  dose: string
  time: string
  dateTime: string
  status: 'confirmed' | 'due' | 'upcoming'
}

type PacketMetadata = {
  commit?: string
  includeProvenance?: boolean
  version?: string
}

const topicLabels: Record<CorrespondenceTopic, string> = {
  billing_dispute: 'billing dispute',
  care_summary: 'care summary',
  coverage_appeal: 'coverage appeal',
  prior_authorization: 'prior authorization',
}

export function caregiverName(plan: CarePlan, id: string) {
  return plan.caregivers.find((caregiver) => caregiver.id === id)?.name ?? 'Unassigned'
}

export function medicationLabel(medication: Medication) {
  return `${medication.name} ${medication.dose}`.trim()
}

export function upcomingDoses(plan: CarePlan, now = new Date(), hours = 24): DueDose[] {
  const windowEnd = new Date(now.getTime() + hours * 60 * 60 * 1000)
  return plan.medications
    .filter((medication) => medication.frequency !== 'as_needed')
    .flatMap((medication) =>
      medication.times.flatMap((time) => {
        const dateTime = nextScheduledDoseFor(medication, time, now)
        if (!dateTime) return []
        const status =
          medication.lastConfirmedAt && sameLocalDate(new Date(medication.lastConfirmedAt), dateTime)
            ? 'confirmed'
            : dateTime <= now
              ? 'due'
              : 'upcoming'

        return [
          {
            medicationId: medication.id,
            medicationName: medication.name,
            dose: medication.dose,
            time,
            dateTime: dateTime.toISOString(),
            status,
          } satisfies DueDose,
        ]
      }),
    )
    .filter((dose) => new Date(dose.dateTime) <= windowEnd)
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
}

/**
 * Compute the next dose-time for a medication at the given clock time,
 * honoring the medication's frequency:
 *  - daily / twice_daily: today at HH:MM or tomorrow if past.
 *  - weekly: scan up to 7 days forward to find the next weekday that's in
 *    the medication's `weekdays` list. Returns null if no weekdays are
 *    configured (caller treats as un-scheduled).
 *  - as_needed: returns null (caller already filters, defensive guard).
 */
function nextScheduledDoseFor(
  medication: {
    frequency: 'daily' | 'twice_daily' | 'weekly' | 'as_needed'
    weekdays?: number[]
  },
  time: string,
  now: Date,
): Date | null {
  if (medication.frequency === 'as_needed') return null
  if (medication.frequency === 'weekly') {
    const allowedDays = medication.weekdays ?? []
    if (allowedDays.length === 0) return null
    const [hours = '0', minutes = '0'] = time.split(':')
    for (let step = 0; step < 7; step += 1) {
      const candidate = new Date(now)
      candidate.setDate(now.getDate() + step)
      candidate.setHours(Number(hours), Number(minutes), 0, 0)
      if (candidate < now) continue
      if (allowedDays.includes(candidate.getDay())) return candidate
    }
    return null
  }
  return nextDateForTime(time, now)
}

export function careLoad(plan: CarePlan, now = new Date()) {
  const openTasks = plan.tasks.filter((task) => task.status !== 'done').length
  const dueMeds = upcomingDoses(plan, now).filter((dose) => dose.status === 'due').length
  const nextSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const appointments = plan.appointments.filter((appointment) => {
    const date = new Date(appointment.dateTime)
    return date >= now && date <= nextSevenDays
  }).length

  return {
    openTasks,
    dueMeds,
    appointments,
    riskLevel: dueMeds > 1 || openTasks > 4 ? 'high' : dueMeds === 1 || openTasks > 2 ? 'watch' : 'steady',
  }
}

export function buildInsuranceDraft(plan: CarePlan, topic: CorrespondenceTopic, facts: string) {
  const recipient = plan.recipient
  const label = topicLabels[topic]
  return [
    `Subject: ${recipient.name} ${label}`,
    '',
    'To whom it may concern,',
    '',
    `I am writing on behalf of ${recipient.name}, policy ${recipient.policyNumber}, regarding a ${label}.`,
    '',
    facts.trim(),
    '',
    `Relevant care context: ${recipient.name} is under the care of ${recipient.primaryDoctor}. Current documented conditions include ${recipient.conditions}. Current allergies: ${recipient.allergies}.`,
    '',
    'Please review the enclosed information and confirm the next step, required documentation, and expected response date in writing.',
    '',
    'Sincerely,',
    plan.caregivers[0]?.name ?? 'Family caregiver',
  ].join('\n')
}

export function emergencyPacketMarkdown(plan: CarePlan, metadata: PacketMetadata = {}) {
  const meds = plan.medications
    .map(
      (medication) =>
        `- ${medicationLabel(medication)}: ${medication.frequency.replace('_', ' ')}, ${medication.times.join(
          ', ',
        )}. Prescriber: ${medication.prescriber}. ${medication.instructions}`,
    )
    .join('\n')
  const caregivers = plan.caregivers
    .map((caregiver) => `- ${caregiver.name} (${caregiver.role}): ${caregiver.phone}, ${caregiver.email}`)
    .join('\n')
  const appointments = plan.appointments
    .slice()
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
    .map(
      (appointment) =>
        `- ${formatDateTime(appointment.dateTime)}: ${appointment.clinician}, ${appointment.reason}. ${appointment.location}`,
    )
    .join('\n')
  const provenance =
    plan.activityLog
      .slice(0, 5)
      .map((entry) => `- ${entry.at}: ${entry.summary} Source: ${entry.sourceId}`)
      .join('\n') || '- No intake activity recorded.'
  const provenanceSection =
    metadata.includeProvenance === false
      ? ''
      : `
## Provenance

${provenance}
`

  return `# Emergency Packet: ${plan.recipient.name}

Generated: ${new Date().toLocaleString()}
App version: ${metadata.version ?? 'unknown'}
App commit: ${metadata.commit ?? 'unknown'}
Care schema: ${plan.schemaVersion}
Care plan updated: ${plan.updatedAt}

## Identity

- Date of birth: ${plan.recipient.dateOfBirth}
- Address: ${plan.recipient.address}
- Primary doctor: ${plan.recipient.primaryDoctor}
- Pharmacy: ${plan.recipient.pharmacy}
- Insurer: ${plan.recipient.insurer}
- Policy number: ${plan.recipient.policyNumber}

## Conditions And Allergies

- Conditions: ${plan.recipient.conditions}
- Allergies: ${plan.recipient.allergies}

## Medication List

${meds}

## Caregivers

${caregivers}

## Upcoming Appointments

${appointments}

${provenanceSection}
## Emergency Instructions

${plan.emergencyInstructions}
`
}

export function packetHtmlFromMarkdown(markdown: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Emergency Packet</title>
  <style>
    body { color: #0f172a; font-family: system-ui, sans-serif; line-height: 1.5; margin: 2rem auto; max-width: 840px; padding: 0 1rem; }
    h1, h2 { color: #115e59; }
    li { margin: 0.25rem 0; }
    @media print { body { margin: 0.5in; max-width: none; } }
  </style>
</head>
<body>
${markdownToHtml(markdown)}
</body>
</html>`
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`))
}

function nextDateForTime(time: string, now: Date) {
  const [hours = '0', minutes = '0'] = time.split(':')
  const date = new Date(now)
  date.setHours(Number(hours), Number(minutes), 0, 0)
  if (date < now) {
    date.setDate(date.getDate() + 1)
  }
  return date
}

function sameLocalDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function markdownToHtml(markdown: string) {
  const lines = markdown.split('\n')
  const html: string[] = []
  let inList = false

  for (const line of lines) {
    if (line.startsWith('# ')) {
      if (inList) html.push('</ul>')
      inList = false
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`)
    } else if (line.startsWith('## ')) {
      if (inList) html.push('</ul>')
      inList = false
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`)
    } else if (line.startsWith('- ')) {
      if (!inList) html.push('<ul>')
      inList = true
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`)
    } else if (line.trim()) {
      if (inList) html.push('</ul>')
      inList = false
      html.push(`<p>${escapeHtml(line)}</p>`)
    }
  }

  if (inList) html.push('</ul>')
  return html.join('\n')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
