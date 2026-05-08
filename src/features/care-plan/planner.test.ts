import { describe, expect, it } from 'vitest'
import { buildInsuranceDraft, careLoad, emergencyPacketMarkdown, upcomingDoses } from './planner'
import { sampleCarePlan } from './sample'

describe('care planner', () => {
  it('computes due doses for the next care window', () => {
    const now = new Date('2026-05-08T16:45:00.000Z')
    const doses = upcomingDoses(sampleCarePlan, now, 6)

    expect(doses.some((dose) => dose.medicationName === 'Lisinopril')).toBe(true)
    expect(doses.every((dose) => new Date(dose.dateTime).getTime() >= now.getTime())).toBe(true)
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
    const packet = emergencyPacketMarkdown(sampleCarePlan)

    expect(packet).toContain('Metformin')
    expect(packet).toContain('Ana')
    expect(packet).toContain(sampleCarePlan.recipient.allergies)
  })
})
