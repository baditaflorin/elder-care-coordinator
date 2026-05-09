import { carePlanSchema, type CarePlan } from '../care-plan/types'

export function migrateCarePlan(input: unknown): CarePlan {
  const direct = carePlanSchema.safeParse(input)
  if (direct.success) return direct.data

  if (isRecord(input)) {
    const withDefaults = {
      ...input,
      activityLog: Array.isArray(input.activityLog) ? input.activityLog : [],
      schemaVersion: input.schemaVersion === 'care-plan.v1' ? input.schemaVersion : 'care-plan.v1',
    }
    return carePlanSchema.parse(withDefaults)
  }

  return carePlanSchema.parse(input)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
