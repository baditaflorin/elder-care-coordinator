import { z } from 'zod'

export const schemaVersion = 'care-plan.v1'

export const caregiverRoleSchema = z.enum(['primary', 'backup', 'medical', 'finance', 'transport'])
export const taskStatusSchema = z.enum(['open', 'waiting', 'done'])
export const medicationFrequencySchema = z.enum(['daily', 'twice_daily', 'weekly', 'as_needed'])
export const correspondenceTopicSchema = z.enum([
  'coverage_appeal',
  'prior_authorization',
  'billing_dispute',
  'care_summary',
])

export const caregiverSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  role: caregiverRoleSchema,
  phone: z.string(),
  email: z.string(),
})

export const careRecipientSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string(),
  address: z.string(),
  primaryDoctor: z.string(),
  pharmacy: z.string(),
  insurer: z.string(),
  policyNumber: z.string(),
  allergies: z.string(),
  conditions: z.string(),
})

export const medicationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  dose: z.string(),
  frequency: medicationFrequencySchema,
  times: z.array(z.string()),
  prescriber: z.string(),
  purpose: z.string(),
  instructions: z.string(),
  refillBy: z.string(),
  lastConfirmedAt: z.string().optional(),
  confirmedBy: z.string().optional(),
})

export const appointmentSchema = z.object({
  id: z.string(),
  dateTime: z.string(),
  clinician: z.string(),
  location: z.string(),
  reason: z.string(),
  preparation: z.string(),
  followUp: z.string(),
  transportOwnerId: z.string(),
})

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  ownerId: z.string(),
  dueDate: z.string(),
  status: taskStatusSchema,
})

export const correspondenceSchema = z.object({
  id: z.string(),
  topic: correspondenceTopicSchema,
  recipient: z.string(),
  facts: z.string(),
  draft: z.string(),
  updatedAt: z.string(),
})

export const noteSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.string(),
})

export const carePlanSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  createdAt: z.string(),
  updatedAt: z.string(),
  recipient: careRecipientSchema,
  caregivers: z.array(caregiverSchema),
  medications: z.array(medicationSchema),
  appointments: z.array(appointmentSchema),
  tasks: z.array(taskSchema),
  correspondence: z.array(correspondenceSchema),
  notes: z.array(noteSchema),
  emergencyInstructions: z.string(),
})

export type Caregiver = z.infer<typeof caregiverSchema>
export type CarePlan = z.infer<typeof carePlanSchema>
export type CorrespondenceTopic = z.infer<typeof correspondenceTopicSchema>
export type Medication = z.infer<typeof medicationSchema>
export type Appointment = z.infer<typeof appointmentSchema>

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}
