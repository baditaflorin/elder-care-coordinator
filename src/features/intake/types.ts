import { z } from 'zod'

export const candidateTypeSchema = z.enum([
  'appointment',
  'correspondence',
  'medication',
  'medication_confirmation',
  'note',
  'task',
])

export const detectedShapeSchema = z.enum([
  'appointment',
  'csv',
  'discharge_reconciliation',
  'empty',
  'family_chat',
  'insurance_denial',
  'medication_list',
  'prescription_sig',
  'prior_authorization',
  'unknown',
])

export const warningSeveritySchema = z.enum(['info', 'warning', 'needs_clarification', 'error'])
export const confidenceLevelSchema = z.enum(['high', 'medium', 'low'])

export const intakeWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  nextStep: z.string(),
  severity: warningSeveritySchema,
})

export const intakeCandidateSchema = z.object({
  id: z.string(),
  type: candidateTypeSchema,
  title: z.string(),
  confidence: z.number().min(0).max(1),
  confidenceLevel: confidenceLevelSchema,
  sourceText: z.string(),
  sourceLines: z.array(z.number()),
  fields: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.boolean()])),
  warnings: z.array(intakeWarningSchema),
  explanation: z.array(z.string()),
})

export const intakeResultSchema = z.object({
  schemaVersion: z.literal('intake.v1'),
  sourceHash: z.string(),
  sourceBytes: z.number(),
  normalizedText: z.string(),
  detectedShape: detectedShapeSchema,
  confidence: z.number().min(0).max(1),
  confidenceLevel: confidenceLevelSchema,
  candidates: z.array(intakeCandidateSchema),
  warnings: z.array(intakeWarningSchema),
  debug: z.object({
    parser: z.string(),
    lineCount: z.number(),
    rules: z.array(z.string()),
  }),
})

export type CandidateType = z.infer<typeof candidateTypeSchema>
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>
export type DetectedShape = z.infer<typeof detectedShapeSchema>
export type IntakeCandidate = z.infer<typeof intakeCandidateSchema>
export type IntakeResult = z.infer<typeof intakeResultSchema>
export type IntakeWarning = z.infer<typeof intakeWarningSchema>
