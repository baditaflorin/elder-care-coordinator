import { z } from 'zod'
import { appSettingsSchema, defaultSettings, parseSettings, type AppSettings } from '../settings/settings'
import { carePlanSchema, type CarePlan } from '../care-plan/types'
import { migrateCarePlan } from './migrations'

export const appStateSchema = z.object({
  schemaVersion: z.literal('elder-care-state.v1'),
  appVersion: z.string(),
  commit: z.string(),
  exportedAt: z.string(),
  carePlan: z.unknown(),
  settings: z.unknown().optional(),
})

export type AppStateFile = {
  carePlan: CarePlan
  settings: AppSettings
}

export function buildStateFile(
  plan: CarePlan,
  settings: AppSettings,
  metadata: { commit: string; version: string },
) {
  const state = {
    schemaVersion: 'elder-care-state.v1',
    appVersion: metadata.version,
    commit: metadata.commit,
    exportedAt: new Date().toISOString(),
    carePlan: carePlanSchema.parse(plan),
    settings: appSettingsSchema.parse(settings),
  } satisfies z.infer<typeof appStateSchema>

  return `${JSON.stringify(state, null, 2)}\n`
}

export function parseStateFile(raw: string): AppStateFile {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error(
      'This is not valid JSON. Choose a workspace state file exported by Elder Care Coordinator.',
    )
  }

  const parsed = appStateSchema.safeParse(json)
  if (!parsed.success) {
    throw new Error('This JSON is not an Elder Care Coordinator workspace state file.')
  }

  return {
    carePlan: migrateCarePlan(parsed.data.carePlan),
    settings: parsed.data.settings ? parseSettings(parsed.data.settings) : defaultSettings,
  }
}
