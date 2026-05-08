import {
  CalendarPlus,
  Check,
  Database,
  Download,
  FileText,
  KeyRound,
  MailPlus,
  Mic,
  Pill,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import { useMemo, useState, type ChangeEvent } from 'react'
import type { ReactNode } from 'react'
import { buildLocalReport, type LocalReport } from '../analytics/duckdbReport'
import { fallbackCorrespondenceDraft, improveDraftWithLocalLlm } from '../assistant/localAssistant'
import { transcribeCareNote } from '../assistant/whisper'
import { encryptWithAgePassphrase, generateAgeRecipientPair } from '../crypto/packetCrypto'
import { renderPacketWithPandoc } from '../export/pandoc'
import { downloadText } from '../../shared/download'
import { useLatestCommit } from '../../shared/useLatestCommit'
import {
  careLoad,
  caregiverName,
  emergencyPacketMarkdown,
  formatDate,
  formatDateTime,
  medicationLabel,
  packetHtmlFromMarkdown,
  upcomingDoses,
} from './planner'
import { useCarePlan } from './useCarePlan'
import type { CarePlan, CorrespondenceTopic } from './types'
import { newId } from './types'

type WorkspaceProps = {
  version: string
  commit: string
}

type Tab = 'dashboard' | 'medications' | 'appointments' | 'correspondence' | 'packet' | 'family'

const repoUrl = 'https://github.com/baditaflorin/elder-care-coordinator'
const paypalUrl = 'https://www.paypal.com/paypalme/florinbadita'

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: 'Today' },
  { id: 'medications', label: 'Medications' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'correspondence', label: 'Letters' },
  { id: 'packet', label: 'Packet' },
  { id: 'family', label: 'Family' },
]

export function CareWorkspace({ version, commit }: WorkspaceProps) {
  const { error, lastSavedAt, loadState, plan, reset, setError, updatePlan } = useCarePlan()
  const displayCommit = useLatestCommit(commit)
  const [tab, setTab] = useState<Tab>('dashboard')
  const load = useMemo(() => careLoad(plan), [plan])
  const doses = useMemo(() => upcomingDoses(plan), [plan])

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark">
              <ShieldCheck aria-hidden="true" size={23} />
            </div>
            <div>
              <h1>Elder Care Coordinator</h1>
              <p>
                v{version} · commit {displayCommit}
              </p>
            </div>
          </div>
          <div className="top-actions">
            <a href={repoUrl} target="_blank" rel="noreferrer">
              Star on GitHub
            </a>
            <a href={paypalUrl} target="_blank" rel="noreferrer">
              Support via PayPal
            </a>
          </div>
        </header>

        <section className="patient-strip" aria-label="Care profile summary">
          <div>
            <p className="eyebrow">Care profile</p>
            <h2>{plan.recipient.name}</h2>
          </div>
          <Metric
            label="Due meds"
            value={String(load.dueMeds)}
            tone={load.dueMeds > 0 ? 'alert' : 'steady'}
          />
          <Metric
            label="Open tasks"
            value={String(load.openTasks)}
            tone={load.openTasks > 2 ? 'watch' : 'steady'}
          />
          <Metric label="7-day visits" value={String(load.appointments)} tone="steady" />
          <div className="save-state">
            <span>{loadState === 'loading' ? 'Loading local plan' : 'Saved locally'}</span>
            <small>{lastSavedAt ? formatDateTime(lastSavedAt) : 'IndexedDB + Yjs'}</small>
          </div>
        </section>

        {error ? (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="workspace-shell">
          <nav className="side-nav" aria-label="Care workspace">
            {tabs.map((item) => (
              <button
                className={tab === item.id ? 'active' : ''}
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <section className="workspace-panel">
            {tab === 'dashboard' ? <Dashboard plan={plan} doses={doses} updatePlan={updatePlan} /> : null}
            {tab === 'medications' ? <MedicationsPanel plan={plan} updatePlan={updatePlan} /> : null}
            {tab === 'appointments' ? <AppointmentsPanel plan={plan} updatePlan={updatePlan} /> : null}
            {tab === 'correspondence' ? (
              <CorrespondencePanel plan={plan} setError={setError} updatePlan={updatePlan} />
            ) : null}
            {tab === 'packet' ? <PacketPanel plan={plan} setError={setError} /> : null}
            {tab === 'family' ? <FamilyPanel plan={plan} reset={reset} updatePlan={updatePlan} /> : null}
          </section>
        </div>
      </div>
    </main>
  )
}

function Dashboard({
  doses,
  plan,
  updatePlan,
}: {
  doses: ReturnType<typeof upcomingDoses>
  plan: CarePlan
  updatePlan: (recipe: (draft: CarePlan) => void) => void
}) {
  const [report, setReport] = useState<LocalReport | null>(null)
  const [busy, setBusy] = useState(false)

  async function runReport() {
    setBusy(true)
    try {
      setReport(await buildLocalReport(plan))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel-grid">
      <section className="section-block span-7">
        <SectionTitle icon={<Pill size={20} />} title="Medication Handoff" />
        <div className="stack">
          {doses.slice(0, 6).map((dose) => (
            <div className="list-row" key={`${dose.medicationId}-${dose.dateTime}`}>
              <div>
                <strong>{dose.medicationName}</strong>
                <span>
                  {dose.dose} · {dose.time}
                </span>
              </div>
              <button
                className={dose.status === 'confirmed' ? 'status confirmed' : 'status'}
                type="button"
                onClick={() =>
                  updatePlan((draft) => {
                    const medication = draft.medications.find((item) => item.id === dose.medicationId)
                    if (medication) {
                      medication.lastConfirmedAt = new Date().toISOString()
                      medication.confirmedBy = draft.caregivers[0]?.id
                    }
                  })
                }
              >
                <Check size={16} />
                {dose.status === 'confirmed' ? 'Done' : 'Confirm'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block span-5">
        <SectionTitle icon={<Database size={20} />} title="Local Report" />
        <button className="wide-action" type="button" onClick={runReport} disabled={busy}>
          <Database size={18} />
          {busy ? 'Running DuckDB' : 'Run DuckDB report'}
        </button>
        {report ? (
          <dl className="report-grid">
            <div>
              <dt>Medications</dt>
              <dd>{report.medicationCount}</dd>
            </div>
            <div>
              <dt>Open tasks</dt>
              <dd>{report.openTaskCount}</dd>
            </div>
            <div>
              <dt>Appointments</dt>
              <dd>{report.upcomingAppointmentCount}</dd>
            </div>
            <div>
              <dt>Refills soon</dt>
              <dd>{report.refillsDueSoon}</dd>
            </div>
            <p>Engine: {report.engine}</p>
          </dl>
        ) : null}
      </section>

      <section className="section-block span-6">
        <SectionTitle icon={<CalendarPlus size={20} />} title="Upcoming Appointments" />
        <div className="stack">
          {plan.appointments.map((appointment) => (
            <div className="compact-card" key={appointment.id}>
              <strong>{appointment.clinician}</strong>
              <span>{formatDateTime(appointment.dateTime)}</span>
              <p>{appointment.preparation}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block span-6">
        <SectionTitle icon={<Users size={20} />} title="Family Queue" />
        <div className="stack">
          {plan.tasks.map((task) => (
            <div className="list-row" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>
                  {caregiverName(plan, task.ownerId)} · {formatDate(task.dueDate)}
                </span>
              </div>
              <span className={`task-chip ${task.status}`}>{task.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function MedicationsPanel({
  plan,
  updatePlan,
}: {
  plan: CarePlan
  updatePlan: (recipe: (draft: CarePlan) => void) => void
}) {
  const [form, setForm] = useState({
    dose: '',
    instructions: '',
    name: '',
    prescriber: '',
    purpose: '',
    refillBy: new Date().toISOString().slice(0, 10),
    times: '08:00',
  })

  function addMedication() {
    if (!form.name.trim()) return
    updatePlan((draft) => {
      draft.medications.push({
        id: newId('med'),
        name: form.name.trim(),
        dose: form.dose.trim(),
        frequency: form.times.includes(',') ? 'twice_daily' : 'daily',
        times: form.times
          .split(',')
          .map((time) => time.trim())
          .filter(Boolean),
        prescriber: form.prescriber.trim(),
        purpose: form.purpose.trim(),
        instructions: form.instructions.trim(),
        refillBy: form.refillBy,
      })
    })
    setForm({
      dose: '',
      instructions: '',
      name: '',
      prescriber: '',
      purpose: '',
      refillBy: form.refillBy,
      times: '08:00',
    })
  }

  return (
    <div className="panel-grid">
      <section className="section-block span-7">
        <SectionTitle icon={<Pill size={20} />} title="Medication Schedule" />
        <div className="stack">
          {plan.medications.map((medication) => (
            <div className="compact-card" key={medication.id}>
              <div className="row-between">
                <strong>{medicationLabel(medication)}</strong>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Remove ${medication.name}`}
                  onClick={() =>
                    updatePlan((draft) => {
                      draft.medications = draft.medications.filter((item) => item.id !== medication.id)
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <span>
                {medication.frequency.replace('_', ' ')} · {medication.times.join(', ')} · refill by{' '}
                {formatDate(medication.refillBy)}
              </span>
              <p>{medication.instructions}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section-block span-5">
        <SectionTitle icon={<Plus size={20} />} title="Add Medication" />
        <FormField label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <FormField label="Dose" value={form.dose} onChange={(value) => setForm({ ...form, dose: value })} />
        <FormField
          label="Times"
          value={form.times}
          onChange={(value) => setForm({ ...form, times: value })}
        />
        <FormField
          label="Prescriber"
          value={form.prescriber}
          onChange={(value) => setForm({ ...form, prescriber: value })}
        />
        <FormField
          label="Purpose"
          value={form.purpose}
          onChange={(value) => setForm({ ...form, purpose: value })}
        />
        <FormField
          label="Instructions"
          value={form.instructions}
          onChange={(value) => setForm({ ...form, instructions: value })}
        />
        <FormField
          label="Refill by"
          type="date"
          value={form.refillBy}
          onChange={(value) => setForm({ ...form, refillBy: value })}
        />
        <button className="wide-action" type="button" onClick={addMedication}>
          <Plus size={18} />
          Add medication
        </button>
      </section>
    </div>
  )
}

function AppointmentsPanel({
  plan,
  updatePlan,
}: {
  plan: CarePlan
  updatePlan: (recipe: (draft: CarePlan) => void) => void
}) {
  const [form, setForm] = useState(() => ({
    clinician: '',
    dateTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    followUp: '',
    location: '',
    preparation: '',
    reason: '',
  }))

  function addAppointment() {
    if (!form.clinician.trim()) return
    updatePlan((draft) => {
      draft.appointments.push({
        id: newId('appt'),
        clinician: form.clinician,
        dateTime: new Date(form.dateTime).toISOString(),
        followUp: form.followUp,
        location: form.location,
        preparation: form.preparation,
        reason: form.reason,
        transportOwnerId: draft.caregivers[0]?.id ?? '',
      })
    })
    setForm({ ...form, clinician: '', followUp: '', location: '', preparation: '', reason: '' })
  }

  return (
    <div className="panel-grid">
      <section className="section-block span-7">
        <SectionTitle icon={<CalendarPlus size={20} />} title="Appointments" />
        <div className="stack">
          {plan.appointments.map((appointment) => (
            <div className="compact-card" key={appointment.id}>
              <div className="row-between">
                <strong>{appointment.clinician}</strong>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Remove ${appointment.clinician}`}
                  onClick={() =>
                    updatePlan((draft) => {
                      draft.appointments = draft.appointments.filter((item) => item.id !== appointment.id)
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <span>{formatDateTime(appointment.dateTime)}</span>
              <p>{appointment.reason}</p>
              <p>{appointment.preparation}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section-block span-5">
        <SectionTitle icon={<Plus size={20} />} title="Add Visit" />
        <FormField
          label="Clinician"
          value={form.clinician}
          onChange={(value) => setForm({ ...form, clinician: value })}
        />
        <FormField
          label="Date and time"
          type="datetime-local"
          value={form.dateTime}
          onChange={(value) => setForm({ ...form, dateTime: value })}
        />
        <FormField
          label="Location"
          value={form.location}
          onChange={(value) => setForm({ ...form, location: value })}
        />
        <FormField
          label="Reason"
          value={form.reason}
          onChange={(value) => setForm({ ...form, reason: value })}
        />
        <FormField
          label="Preparation"
          value={form.preparation}
          onChange={(value) => setForm({ ...form, preparation: value })}
        />
        <FormField
          label="Follow-up"
          value={form.followUp}
          onChange={(value) => setForm({ ...form, followUp: value })}
        />
        <button className="wide-action" type="button" onClick={addAppointment}>
          <Plus size={18} />
          Add appointment
        </button>
      </section>
    </div>
  )
}

function CorrespondencePanel({
  plan,
  setError,
  updatePlan,
}: {
  plan: CarePlan
  setError: (message: string) => void
  updatePlan: (recipe: (draft: CarePlan) => void) => void
}) {
  const current = plan.correspondence[0]
  const [progress, setProgress] = useState('')
  const [voiceProgress, setVoiceProgress] = useState('')

  if (!current) return null
  const active = current

  function updateCurrent(recipe: (item: typeof active) => void) {
    updatePlan((draft) => {
      const item = draft.correspondence.find((entry) => entry.id === active.id)
      if (item) {
        recipe(item)
        item.updatedAt = new Date().toISOString()
      }
    })
  }

  async function improveDraft() {
    setProgress('')
    try {
      const next = await improveDraftWithLocalLlm(plan, active.draft, setProgress)
      updateCurrent((item) => {
        item.draft = next
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Local LLM drafting failed.')
    }
  }

  async function transcribe(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setVoiceProgress('')
    try {
      const text = await transcribeCareNote(file, setVoiceProgress)
      updateCurrent((item) => {
        item.facts = `${item.facts}\n${text}`.trim()
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Whisper transcription failed.')
    }
  }

  return (
    <div className="panel-grid">
      <section className="section-block span-5">
        <SectionTitle icon={<MailPlus size={20} />} title="Insurance Facts" />
        <label className="field">
          <span>Topic</span>
          <select
            value={current.topic}
            onChange={(event) =>
              updateCurrent((item) => (item.topic = event.target.value as CorrespondenceTopic))
            }
          >
            <option value="coverage_appeal">Coverage appeal</option>
            <option value="prior_authorization">Prior authorization</option>
            <option value="billing_dispute">Billing dispute</option>
            <option value="care_summary">Care summary</option>
          </select>
        </label>
        <label className="field">
          <span>Recipient</span>
          <input
            value={current.recipient}
            onChange={(event) => updateCurrent((item) => (item.recipient = event.target.value))}
          />
        </label>
        <label className="field">
          <span>Facts</span>
          <textarea
            value={current.facts}
            onChange={(event) => updateCurrent((item) => (item.facts = event.target.value))}
          />
        </label>
        <label className="file-input">
          <Mic size={18} />
          Add voice note
          <input accept="audio/*" type="file" onChange={transcribe} />
        </label>
        {voiceProgress ? <p className="module-status">{voiceProgress}</p> : null}
        <button
          className="wide-action"
          type="button"
          onClick={() =>
            updateCurrent((item) => (item.draft = fallbackCorrespondenceDraft(plan, item.topic, item.facts)))
          }
        >
          <FileText size={18} />
          Draft letter
        </button>
      </section>
      <section className="section-block span-7">
        <SectionTitle icon={<FileText size={20} />} title="Draft" />
        <textarea
          className="draft-box"
          value={current.draft}
          onChange={(event) => updateCurrent((item) => (item.draft = event.target.value))}
        />
        <div className="button-row">
          <button className="wide-action" type="button" onClick={improveDraft}>
            <Sparkles size={18} />
            Local LLM polish
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={() => downloadText('insurance-draft.txt', current.draft)}
          >
            <Download size={18} />
            Download
          </button>
        </div>
        {progress ? <p className="module-status">{progress}</p> : null}
      </section>
    </div>
  )
}

function PacketPanel({ plan, setError }: { plan: CarePlan; setError: (message: string) => void }) {
  const markdown = useMemo(() => emergencyPacketMarkdown(plan), [plan])
  const [passphrase, setPassphrase] = useState('')
  const [cryptoStatus, setCryptoStatus] = useState('')
  const [agePair, setAgePair] = useState<{ identity: string; recipient: string } | null>(null)

  async function downloadPandocHtml() {
    try {
      const html = await renderPacketWithPandoc(markdown)
      downloadText('emergency-packet.html', html, 'text/html;charset=utf-8')
    } catch {
      downloadText('emergency-packet.html', packetHtmlFromMarkdown(markdown), 'text/html;charset=utf-8')
    }
  }

  async function encryptPacket() {
    setCryptoStatus('Encrypting packet locally...')
    try {
      const encrypted = await encryptWithAgePassphrase(markdown, passphrase)
      downloadText('emergency-packet.age.txt', encrypted.armored)
      setCryptoStatus(
        `Encrypted with age passphrase. Plaintext checksum ${encrypted.checksum.slice(0, 16)}...`,
      )
    } catch (caught) {
      setCryptoStatus('')
      setError(caught instanceof Error ? caught.message : 'Encryption failed.')
    }
  }

  async function createAgePair() {
    try {
      setAgePair(await generateAgeRecipientPair())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to generate age key.')
    }
  }

  return (
    <div className="panel-grid">
      <section className="section-block span-7">
        <SectionTitle icon={<ShieldCheck size={20} />} title="Emergency Packet Preview" />
        <pre className="packet-preview">{markdown}</pre>
      </section>
      <section className="section-block span-5">
        <SectionTitle icon={<Download size={20} />} title="Exports" />
        <button
          className="wide-action"
          type="button"
          onClick={() => downloadText('emergency-packet.md', markdown)}
        >
          <Download size={18} />
          Markdown
        </button>
        <button className="wide-action" type="button" onClick={downloadPandocHtml}>
          <FileText size={18} />
          HTML via Pandoc
        </button>
        <label className="field">
          <span>Passphrase</span>
          <input value={passphrase} onChange={(event) => setPassphrase(event.target.value)} type="password" />
        </label>
        <button className="wide-action" type="button" onClick={encryptPacket}>
          <KeyRound size={18} />
          Encrypt with age
        </button>
        <button className="secondary-action full" type="button" onClick={createAgePair}>
          <RefreshCw size={18} />
          Generate age recipient
        </button>
        {cryptoStatus ? <p className="module-status">{cryptoStatus}</p> : null}
        {agePair ? (
          <div className="key-box">
            <strong>Recipient</strong>
            <code>{agePair.recipient}</code>
            <strong>Identity</strong>
            <code>{agePair.identity}</code>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function FamilyPanel({
  plan,
  reset,
  updatePlan,
}: {
  plan: CarePlan
  reset: () => Promise<void>
  updatePlan: (recipe: (draft: CarePlan) => void) => void
}) {
  const [note, setNote] = useState('')

  function addNote() {
    if (!note.trim()) return
    updatePlan((draft) => {
      draft.notes.unshift({
        id: newId('note'),
        authorId: draft.caregivers[0]?.id ?? '',
        body: note.trim(),
        createdAt: new Date().toISOString(),
      })
    })
    setNote('')
  }

  return (
    <div className="panel-grid">
      <section className="section-block span-5">
        <SectionTitle icon={<Users size={20} />} title="Caregivers" />
        <div className="stack">
          {plan.caregivers.map((caregiver) => (
            <div className="compact-card" key={caregiver.id}>
              <strong>{caregiver.name}</strong>
              <span>{caregiver.role}</span>
              <p>
                {caregiver.phone} · {caregiver.email}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="section-block span-7">
        <SectionTitle icon={<FileText size={20} />} title="Family Notes" />
        <label className="field">
          <span>New note</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <div className="button-row">
          <button className="wide-action" type="button" onClick={addNote}>
            <Plus size={18} />
            Add note
          </button>
          <button className="secondary-action" type="button" onClick={() => void reset()}>
            <RefreshCw size={18} />
            Reset sample
          </button>
        </div>
        <div className="stack">
          {plan.notes.map((entry) => (
            <div className="compact-card" key={entry.id}>
              <strong>{caregiverName(plan, entry.authorId)}</strong>
              <span>{formatDateTime(entry.createdAt)}</span>
              <p>{entry.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Metric({
  label,
  tone,
  value,
}: {
  label: string
  tone: 'alert' | 'steady' | 'watch'
  value: string
}) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="section-title">
      {icon}
      <h3>{title}</h3>
    </div>
  )
}

function FormField({
  label,
  onChange,
  type = 'text',
  value,
}: {
  label: string
  onChange: (value: string) => void
  type?: string
  value: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}
