import { describe, expect, it } from 'vitest'
import { sampleCarePlan } from '../care-plan/sample'
import { applyIntakeResult } from './apply'
import { analyzeCareInput } from './infer'

describe('care intake apply flow', () => {
  it('applies inferred medications without creating invalid dates', async () => {
    const result = await analyzeCareInput(
      'Prescription directions:\nAmoxicillin 500 mg capsule\nTake 1 capsule by mouth three times daily.',
    )
    const medication = result.candidates.find((candidate) => candidate.type === 'medication')

    expect(medication).toBeDefined()

    const next = applyIntakeResult(sampleCarePlan, result, medication ? [medication.id] : [])
    const applied = next.medications.find((item) => item.name === 'Amoxicillin')

    expect(applied?.refillBy).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(next.activityLog[0]?.summary).toContain('Applied 1 intake candidate')
  })
})
