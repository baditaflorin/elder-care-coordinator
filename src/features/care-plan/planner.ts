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
        const occurrence = resolveDoseOccurrence(medication, time, now)
        if (!occurrence) return []

        return [
          {
            medicationId: medication.id,
            medicationName: medication.name,
            dose: medication.dose,
            time,
            dateTime: occurrence.dateTime.toISOString(),
            status: occurrence.status,
          } satisfies DueDose,
        ]
      }),
    )
    .filter((dose) => new Date(dose.dateTime) <= windowEnd)
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
}

/**
 * Resolve the dose slot a caregiver needs to act on for a single scheduled
 * `time`, honoring the medication's frequency:
 *  - daily / twice_daily: today at HH:MM if that has not happened yet
 *    ('upcoming'). Once the clock passes HH:MM, today's slot stays
 *    surfaced — as 'due' (overdue, unconfirmed) or 'confirmed' — instead of
 *    silently rolling forward to tomorrow. Rolling forward unconditionally
 *    (the previous behavior) made 'due' practically unreachable, since
 *    `now` almost never lands on the exact HH:MM:00.000 instant, so a
 *    missed dose would vanish into "tomorrow, upcoming" with no overdue
 *    signal at all.
 *  - weekly: scan up to 7 days forward for the next allowed weekday. If
 *    today is itself an allowed weekday whose time has already passed,
 *    resolve the same way as daily (due/confirmed) rather than skipping to
 *    next week.
 *  - as_needed: returns null (caller already filters, defensive guard).
 */
function resolveDoseOccurrence(
  medication: {
    frequency: 'daily' | 'twice_daily' | 'weekly' | 'as_needed'
    weekdays?: number[]
    lastConfirmedAt?: string
  },
  time: string,
  now: Date,
): { dateTime: Date; status: DueDose['status'] } | null {
  if (medication.frequency === 'as_needed') return null

  if (medication.frequency === 'weekly') {
    const allowedDays = medication.weekdays ?? []
    if (allowedDays.length === 0) return null
    for (let step = 0; step < 7; step += 1) {
      const candidate = dateAtTime(now, time, step)
      if (!allowedDays.includes(candidate.getDay())) continue
      if (candidate > now) return { dateTime: candidate, status: 'upcoming' }
      return { dateTime: candidate, status: confirmedStatus(medication, candidate, time) }
    }
    return null
  }

  const candidate = dateAtTime(now, time, 0)
  if (candidate > now) return { dateTime: candidate, status: 'upcoming' }
  return { dateTime: candidate, status: confirmedStatus(medication, candidate, time) }
}

/**
 * A dose slot whose time has already passed is 'confirmed' only when the
 * caregiver's confirmation happened on the same local day AND at/after
 * this slot's scheduled clock time. The clock-time check matters for
 * medications with more than one scheduled time per day (e.g.
 * twice_daily), which only carry a single `lastConfirmedAt` timestamp:
 * without it, confirming the 08:00 dose would retroactively mark a
 * still-future, unconfirmed 20:00 dose the same day as 'confirmed' too —
 * risking a caregiver skipping the evening dose because the dashboard
 * already shows it as done.
 */
function confirmedStatus(
  medication: { lastConfirmedAt?: string },
  candidate: Date,
  time: string,
): 'confirmed' | 'due' {
  if (!medication.lastConfirmedAt) return 'due'
  const confirmedAt = new Date(medication.lastConfirmedAt)
  if (!sameLocalDate(confirmedAt, candidate)) return 'due'
  const confirmedMinutes = confirmedAt.getHours() * 60 + confirmedAt.getMinutes()
  return confirmedMinutes >= minutesSinceMidnight(time) ? 'confirmed' : 'due'
}

function parseTimeParts(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':')
  return { hours: Number(hours), minutes: Number(minutes) }
}

function minutesSinceMidnight(time: string) {
  const { hours, minutes } = parseTimeParts(time)
  return hours * 60 + minutes
}

function dateAtTime(now: Date, time: string, dayOffset: number) {
  const { hours, minutes } = parseTimeParts(time)
  const date = new Date(now)
  date.setDate(now.getDate() + dayOffset)
  date.setHours(hours, minutes, 0, 0)
  return date
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
