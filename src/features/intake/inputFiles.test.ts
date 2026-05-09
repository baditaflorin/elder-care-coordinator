import { describe, expect, it } from 'vitest'
import { detectCareInputFormat, prepareCareArtifactText } from './inputFiles'

describe('care input file helpers', () => {
  it('detects common caregiver file formats', () => {
    expect(
      detectCareInputFormat('meds.csv', 'Medication,Dose,Directions\nMetformin,500 mg,twice daily'),
    ).toBe('csv')
    expect(detectCareInputFormat('portal.html', '<table><tr><td>Apixaban</td></tr></table>')).toBe('html')
    expect(detectCareInputFormat('state.json', '{"schemaVersion":"elder-care-state.v1"}')).toBe('state')
  })

  it('turns HTML and JSON into reviewable text', () => {
    expect(prepareCareArtifactText('<p>Metformin 500 mg twice daily</p>', 'html')).toContain('Metformin')
    expect(prepareCareArtifactText('{"medication":"Apixaban 5 mg twice daily"}', 'json')).toContain(
      'Apixaban',
    )
  })

  it('rejects URL fetching with static-friendly guidance', () => {
    expect(() => prepareCareArtifactText('https://example.com/private-portal', 'auto')).toThrow(
      /Paste the rendered text/,
    )
  })
})
