import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

const settingsKey = 'elder-care-coordinator-settings'

export const appSettingsSchema = z.object({
  schemaVersion: z.literal('settings.v1'),
  autoSelectReviewCandidates: z.boolean(),
  defaultCaregiverId: z.string(),
  includeProvenanceInPacket: z.boolean(),
})

export type AppSettings = z.infer<typeof appSettingsSchema>

export const defaultSettings: AppSettings = {
  schemaVersion: 'settings.v1',
  autoSelectReviewCandidates: true,
  defaultCaregiverId: '',
  includeProvenanceInPacket: true,
}

export function parseSettings(input: unknown): AppSettings {
  const parsed = appSettingsSchema.safeParse(input)
  if (parsed.success) return parsed.data
  return defaultSettings
}

export function loadSettings() {
  try {
    const raw = window.localStorage.getItem(settingsKey)
    return raw ? parseSettings(JSON.parse(raw)) : defaultSettings
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: AppSettings) {
  window.localStorage.setItem(settingsKey, JSON.stringify(appSettingsSchema.parse(settings)))
}

export function clearSettings() {
  window.localStorage.removeItem(settingsKey)
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(() =>
    typeof window === 'undefined' ? defaultSettings : loadSettings(),
  )

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const updateSettings = useCallback((recipe: (draft: AppSettings) => void) => {
    setSettings((current) => {
      const draft = structuredClone(current)
      recipe(draft)
      return appSettingsSchema.parse(draft)
    })
  }, [])

  const resetSettings = useCallback(() => {
    clearSettings()
    setSettings(defaultSettings)
  }, [])

  return useMemo(
    () => ({ resetSettings, settings, updateSettings }),
    [resetSettings, settings, updateSettings],
  )
}
