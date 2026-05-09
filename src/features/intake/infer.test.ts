import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { analyzeCareInput } from './infer'

type ExpectedFixture = {
  expectedShape: string
  maxLowConfidence: number
  minCandidates: number
  mustWarn: string[]
  requiredTexts: string[]
  requiredTypes: string[]
}

const fixtureDir = join(process.cwd(), 'test/fixtures/realdata')
const fixtureNames = readdirSync(fixtureDir)
  .filter((name) => name.endsWith('.txt'))
  .sort()

describe('care intake real-data fixtures', () => {
  for (const fixtureName of fixtureNames) {
    it(`infers useful candidates for ${fixtureName}`, async () => {
      const id = fixtureName.replace('.txt', '')
      const input = readFileSync(join(fixtureDir, fixtureName), 'utf8')
      const expected = JSON.parse(
        readFileSync(join(fixtureDir, `${id}.expected.json`), 'utf8'),
      ) as ExpectedFixture

      const result = await analyzeCareInput(input)
      const repeated = await analyzeCareInput(input)

      expect(JSON.stringify(result)).toBe(JSON.stringify(repeated))
      expect(result.detectedShape).toBe(expected.expectedShape)
      expect(result.candidates.length).toBeGreaterThanOrEqual(expected.minCandidates)

      const candidateTypes = new Set<string>(result.candidates.map((candidate) => candidate.type))
      for (const requiredType of expected.requiredTypes) {
        expect(candidateTypes.has(requiredType)).toBe(true)
      }

      const haystack = JSON.stringify(result).toLowerCase()
      for (const requiredText of expected.requiredTexts) {
        expect(haystack).toContain(requiredText.toLowerCase())
      }

      const warnings = [...result.warnings, ...result.candidates.flatMap((candidate) => candidate.warnings)]
        .map((warning) => warning.message.toLowerCase())
        .join('\n')
      for (const requiredWarning of expected.mustWarn) {
        expect(warnings).toContain(requiredWarning.toLowerCase())
      }

      const lowConfidence = result.candidates.filter(
        (candidate) => candidate.confidenceLevel === 'low',
      ).length
      expect(lowConfidence).toBeLessThanOrEqual(expected.maxLowConfidence)
    })
  }

  it('handles empty, huge, and encoding-weird synthetic edge cases without crashing', async () => {
    const empty = await analyzeCareInput('')
    expect(empty.detectedShape).toBe('empty')
    expect(empty.warnings.some((warning) => warning.code === 'empty-input')).toBe(true)

    const weird = await analyzeCareInput('\uFEFFMetformin\u00A0500 mg\r\nTake “one” tablet twice daily')
    expect(weird.normalizedText).toContain('"one"')
    expect(weird.candidates.some((candidate) => candidate.type === 'medication')).toBe(true)

    const huge = await analyzeCareInput('Metformin 500 mg twice daily\n'.repeat(45000))
    expect(huge.warnings.some((warning) => warning.code === 'too-large')).toBe(true)
    expect(huge.candidates).toHaveLength(0)
  })
})
