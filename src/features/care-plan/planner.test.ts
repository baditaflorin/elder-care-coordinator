import { describe, expect, it } from 'vitest'
import { buildInsuranceDraft, careLoad, emergencyPacketMarkdown, upcomingDoses } from './planner'
import { sampleCarePlan } from './sample'
import type { CarePlan, Medication } from './types'

describe('care planner', () => {
  it('computes due doses for the next care window', () => {
    const now = new Date('2026-05-08T16:45:00.000Z')
    const doses = upcomingDoses(sampleCarePlan, now, 6)

    expect(doses.some((dose) => dose.medicationName === 'Lisinopril')).toBe(true)
    // Only 'upcoming' doses are guaranteed to sit in the future relative to
    // `now`. 'due' (overdue, unconfirmed) and 'confirmed' doses describe
    // today's slot that has already arrived, so their dateTime legitimately
    // sits in the past — that is the whole point of surfacing overdue
    // doses instead of silently rolling them forward to tomorrow. See the
    // two regression tests below.
    expect(
      doses
        .filter((dose) => dose.status === 'upcoming')
        .every((dose) => new Date(dose.dateTime).getTime() >= now.getTime()),
    ).toBe(true)
  })

  it('flags an unconfirmed dose whose time has already passed today as due, not silently as tomorrow-upcoming', () => {
    // Regression test: the scheduler used to always roll a past dose time
    // forward to the next day, which made the 'due' (overdue) status
    // practically unreachable — a missed dose would just vanish into
    // "tomorrow, upcoming" with no overdue signal. Apixaban's 08:00 slot in
    // the sample plan has no lastConfirmedAt and 08:00 has already passed
    // by 16:45, so it must show up as an overdue 'due' entry for *today*.
    const now = new Date('2026-05-08T16:45:00.000Z')
    const doses = upcomingDoses(sampleCarePlan, now, 6)
    const apixabanMorning = doses.find(
      (dose) => dose.medicationId === 'med_apixaban' && dose.time === '08:00',
    )

    expect(apixabanMorning?.status).toBe('due')
    expect(new Date(apixabanMorning?.dateTime ?? 0).getTime()).toBeLessThan(now.getTime())
  })

  it('does not mark a later same-day dose confirmed just because an earlier dose was confirmed', () => {
    // Regression test: medications only carry a single lastConfirmedAt
    // timestamp, but twice_daily medications have two dose times per day.
    // Confirming the 08:00 dose must not retroactively mark the still
    // in-the-future 20:00 dose as 'confirmed' — a caregiver seeing "Done"
    // on the evening dose before it was actually given could skip it.
    // Metformin in the sample plan was confirmed at 08:04 UTC; at 16:45 the
    // 20:00 dose has not happened yet and must not read as confirmed.
    const now = new Date('2026-05-08T16:45:00.000Z')
    const doses = upcomingDoses(sampleCarePlan, now, 6)
    const metforminMorning = doses.find(
      (dose) => dose.medicationId === 'med_metformin' && dose.time === '08:00',
    )
    const metforminEvening = doses.find(
      (dose) => dose.medicationId === 'med_metformin' && dose.time === '20:00',
    )

    expect(metforminMorning?.status).toBe('confirmed')
    expect(metforminEvening?.status).not.toBe('confirmed')
    expect(metforminEvening?.status).toBe('upcoming')
  })

  it('summarizes care load', () => {
    const load = careLoad(sampleCarePlan, new Date('2026-05-08T08:00:00.000Z'))

    expect(load.openTasks).toBe(2)
    expect(load.appointments).toBeGreaterThan(0)
  })

  it('builds an insurance draft without losing core identifiers', () => {
    const draft = buildInsuranceDraft(sampleCarePlan, 'coverage_appeal', 'Denied test strips.')

    expect(draft).toContain(sampleCarePlan.recipient.policyNumber)
    expect(draft).toContain('Denied test strips.')
  })

  it('creates an emergency packet with medications and contacts', () => {
    const packet = emergencyPacketMarkdown(sampleCarePlan, { commit: 'abc1234', version: '0.2.0' })

    expect(packet).toContain('Metformin')
    expect(packet).toContain('Ana')
    expect(packet).toContain(sampleCarePlan.recipient.allergies)
    expect(packet).toContain('App version: 0.2.0')
    expect(packet).toContain('App commit: abc1234')
  })

  it('honors weekly schedules by only emitting doses on chosen weekdays', () => {
    // Monday 2026-05-04 12:00 UTC. Friday is weekday 5.
    const monday = new Date('2026-05-04T12:00:00.000Z')
    const plan: CarePlan = {
      ...sampleCarePlan,
      medications: [
        weeklyMed({
          id: 'med_methotrexate',
          name: 'Methotrexate',
          dose: '15 mg',
          times: ['09:00'],
          weekdays: [5],
        }),
      ],
    }
    const doses = upcomingDoses(plan, monday, 24 * 8)
    expect(doses).toHaveLength(1)
    const next = new Date(doses[0]?.dateTime ?? 0)
    expect(next.getDay()).toBe(5)
  })

  it('skips weekly medications with no weekdays configured', () => {
    const now = new Date('2026-05-04T08:00:00.000Z')
    const plan: CarePlan = {
      ...sampleCarePlan,
      medications: [
        weeklyMed({
          id: 'med_weekly',
          name: 'WeeklyUnscheduled',
          dose: '1',
          times: ['09:00'],
          weekdays: [],
        }),
      ],
    }
    const doses = upcomingDoses(plan, now, 24 * 8)
    expect(doses).toHaveLength(0)
  })

  it('excludes as_needed medications from the upcoming schedule entirely', () => {
    const now = new Date('2026-05-04T08:00:00.000Z')
    const plan: CarePlan = {
      ...sampleCarePlan,
      medications: [
        {
          id: 'med_alprazolam',
          name: 'Alprazolam',
          dose: '0.5 mg',
          frequency: 'as_needed',
          times: ['09:00', '21:00'],
          weekdays: [],
          prescriber: 'Dr. Popescu',
          purpose: 'Acute anxiety',
          instructions: 'Use sparingly.',
          refillBy: '2026-05-30',
        },
      ],
    }
    const doses = upcomingDoses(plan, now, 24)
    expect(doses).toHaveLength(0)
  })
})

function weeklyMed(overrides: {
  id: string
  name: string
  dose: string
  times: string[]
  weekdays: number[]
}): Medication {
  return {
    id: overrides.id,
    name: overrides.name,
    dose: overrides.dose,
    frequency: 'weekly',
    times: overrides.times,
    weekdays: overrides.weekdays,
    prescriber: 'Dr. Popescu',
    purpose: 'test',
    instructions: '',
    refillBy: '2026-06-01',
  }
}
