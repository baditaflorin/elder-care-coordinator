import type { ConfidenceLevel, IntakeWarning } from './types'

export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.55) return 'medium'
  return 'low'
}

export function warning(
  code: string,
  message: string,
  nextStep: string,
  severity: IntakeWarning['severity'] = 'warning',
): IntakeWarning {
  return { code, message, nextStep, severity }
}

export function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))))
}
