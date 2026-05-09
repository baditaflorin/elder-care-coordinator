import { describe, expect, it } from 'vitest'
import { sampleCarePlan } from '../care-plan/sample'
import { defaultSettings } from '../settings/settings'
import { buildStateFile, parseStateFile } from './stateFile'

describe('workspace state files', () => {
  it('round-trips care plan and settings through versioned JSON', () => {
    const exported = buildStateFile(sampleCarePlan, defaultSettings, { commit: 'abc1234', version: '0.3.0' })
    const imported = parseStateFile(exported)

    expect(imported.carePlan.recipient.name).toBe(sampleCarePlan.recipient.name)
    expect(imported.settings.schemaVersion).toBe('settings.v1')
  })

  it('rejects unrelated JSON with a user-safe error', () => {
    expect(() => parseStateFile('{"hello":true}')).toThrow(/workspace state file/)
  })
})
