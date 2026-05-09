import {
  AlertTriangle,
  CalendarPlus,
  Check,
  ClipboardCheck,
  Database,
  Download,
  FileText,
  FolderOpen,
  Info,
  KeyRound,
  MailPlus,
  Mic,
  Printer,
  Pill,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import type { ReactNode } from 'react'
import { buildLocalReport, type LocalReport } from '../analytics/duckdbReport'
import { fallbackCorrespondenceDraft, improveDraftWithLocalLlm } from '../assistant/localAssistant'
import { transcribeCareNote } from '../assistant/whisper'
import { encryptWithAgePassphrase, generateAgeRecipientPair } from '../crypto/packetCrypto'
import { renderPacketWithPandoc } from '../export/pandoc'
import { applyIntakeResult } from '../intake/apply'
import { analyzeCareInput } from '../intake/infer'
import {
  combineCareFiles,
  detectCareInputFormat,
  parseCareInputFormat,
  prepareCareArtifactText,
  readCareInputFiles,
  sampleCareArtifact,
  type CareInputFormat,
} from '../intake/inputFiles'
import type { IntakeCandidate, IntakeResult, IntakeWarning } from '../intake/types'
import { useAppSettings, type AppSettings } from '../settings/settings'
import { buildStateFile, parseStateFile } from '../storage/stateFile'
import { copyTextToClipboard, readTextFromClipboard } from '../../shared/clipboard'
import { downloadText } from '../../shared/download'
import { createArtifactShareUrl, readArtifactFromHash } from '../../shared/shareLink'
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
import { correspondenceTopicSchema, newId } from './types'
import type { CarePlan } from './types'

type WorkspaceProps = {
  version: string
  commit: string
}

type PlanUpdater = (recipe: (draft: CarePlan) => void) => void
type PlanReplacer = (nextPlan: CarePlan) => void
type Tab = 'dashboard' | 'medications' | 'appointments' | 'correspondence' | 'packet' | 'family' | 'settings'

const repoUrl = 'https://github.com/baditaflorin/elder-care-coordinator'
const paypalUrl = 'https://www.paypal.com/paypalme/florinbadita'

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: 'Today' },
  { id: 'medications', label: 'Medications' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'correspondence', label: 'Letters' },
  { id: 'packet', label: 'Packet' },
  { id: 'family', label: 'Family' },
  { id: 'settings', label: 'Settings' },
]

export function CareWorkspace({ version, commit }: WorkspaceProps) {
  const { error, lastSavedAt, loadState, plan, replacePlan, reset, setError, updatePlan } = useCarePlan()
  const { resetSettings, settings, updateSettings } = useAppSettings()
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
            {tab === 'dashboard' ? (
              <Dashboard plan={plan} doses={doses} settings={settings} updatePlan={updatePlan} />
            ) : null}
            {tab === 'medications' ? <MedicationsPanel plan={plan} updatePlan={updatePlan} /> : null}
            {tab === 'appointments' ? <AppointmentsPanel plan={plan} updatePlan={updatePlan} /> : null}
            {tab === 'correspondence' ? (
              <CorrespondencePanel plan={plan} setError={setError} updatePlan={updatePlan} />
            ) : null}
            {tab === 'packet' ? (
              <PacketPanel
                commit={displayCommit}
                plan={plan}
                setError={setError}
                settings={settings}
                version={version}
              />
            ) : null}
            {tab === 'family' ? <FamilyPanel plan={plan} reset={reset} updatePlan={updatePlan} /> : null}
            {tab === 'settings' ? (
              <SettingsPanel
                commit={displayCommit}
                plan={plan}
                replacePlan={replacePlan}
                reset={reset}
                resetSettings={resetSettings}
                setError={setError}
                settings={settings}
                updateSettings={updateSettings}
                version={version}
              />
            ) : null}
          </section>
        </div>
      </div>
    </main>
  )
}

function Dashboard({
  doses,
  plan,
  settings,
  updatePlan,
}: {
  doses: ReturnType<typeof upcomingDoses>
  plan: CarePlan
  settings: AppSettings
  updatePlan: PlanUpdater
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
      <IntakePanel settings={settings} updatePlan={updatePlan} />

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

function IntakePanel({ settings, updatePlan }: { settings: AppSettings; updatePlan: PlanUpdater }) {
  const initialSharedArtifact = useMemo(() => readArtifactFromHash(), [])
  const [input, setInput] = useState(initialSharedArtifact)
  const [inputFormat, setInputFormat] = useState<CareInputFormat>('auto')
  const [result, setResult] = useState<IntakeResult | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'ready' | 'cancelled' | 'error' | 'applied'>(
    'idle',
  )
  const [message, setMessage] = useState(initialSharedArtifact ? 'Loaded care artifact from this URL.' : '')
  const [fileMessage, setFileMessage] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const controllerRef = useRef<AbortController | null>(null)
  const debug = useMemo(() => new URLSearchParams(window.location.search).has('debug'), [])

  useEffect(
    () => () => {
      controllerRef.current?.abort()
    },
    [],
  )

  async function analyze() {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus('analyzing')
    setMessage('Reviewing care artifact...')
    const startedAt = performance.now()

    try {
      const reviewText = prepareCareArtifactText(input, inputFormat)
      const next = await analyzeCareInput(reviewText, controller.signal)
      if (controller.signal.aborted) return
      const defaults = Object.fromEntries(
        next.candidates.map((candidate) => [
          candidate.id,
          settings.autoSelectReviewCandidates &&
            candidate.confidenceLevel !== 'low' &&
            !candidate.warnings.some((warning) => warning.severity === 'needs_clarification'),
        ]),
      )
      setResult(next)
      setSelected(defaults)
      setStatus('ready')
      setMessage(
        `Detected ${formatShape(next.detectedShape)} with ${next.candidates.length} candidate${
          next.candidates.length === 1 ? '' : 's'
        } in ${Math.round(performance.now() - startedAt)}ms.`,
      )
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        setStatus('cancelled')
        setMessage('Review cancelled. The previous care plan stayed unchanged.')
        return
      }
      setStatus('error')
      setMessage(
        caught instanceof Error
          ? `Could not review this care artifact. ${caught.message}`
          : 'Could not review this care artifact. Paste a smaller or more complete section.',
      )
    }
  }

  async function loadFiles(files: FileList | File[]) {
    try {
      const readFiles = await readCareInputFiles(files)
      if (!readFiles.length) return
      const stateFile = readFiles.find((file) => file.format === 'state')
      if (stateFile) {
        setStatus('error')
        setMessage(
          'This looks like a workspace state file. Import it from Settings, not Care Artifact Review.',
        )
        return
      }
      setInput(combineCareFiles(readFiles))
      setInputFormat('text')
      setFileMessage(
        `Loaded ${readFiles.length} file${readFiles.length === 1 ? '' : 's'}: ${readFiles
          .map((file) => `${file.name} (${file.format})`)
          .join(', ')}.`,
      )
      setResult(null)
      setStatus('idle')
    } catch (caught) {
      setStatus('error')
      setMessage(caught instanceof Error ? caught.message : 'Could not read those files.')
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await readTextFromClipboard()
      const detected = detectCareInputFormat('', text)
      setInput(text)
      setInputFormat(detected === 'state' || detected === 'url' ? 'auto' : detected)
      setMessage('Loaded care artifact from clipboard.')
      setStatus('idle')
    } catch (caught) {
      setStatus('error')
      setMessage(
        caught instanceof Error ? caught.message : 'Clipboard read failed. Use the paste box instead.',
      )
    }
  }

  async function copyShareLink() {
    try {
      const url = createArtifactShareUrl(input)
      await copyTextToClipboard(url)
      setShareMessage('Copied small artifact link.')
    } catch (caught) {
      setShareMessage(caught instanceof Error ? caught.message : 'Could not create a share link.')
    }
  }

  function loadSample() {
    setInput(sampleCareArtifact)
    setInputFormat('text')
    setResult(null)
    setStatus('idle')
    setMessage('Loaded a sample transition-of-care artifact.')
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    void loadFiles(event.dataTransfer.files)
  }

  function cancelAnalysis() {
    controllerRef.current?.abort()
    setStatus('cancelled')
    setMessage('Review cancelled. The previous care plan stayed unchanged.')
  }

  function applySelected() {
    if (!result) return
    const ids = Object.entries(selected)
      .filter(([, checked]) => checked)
      .map(([id]) => id)
    if (!ids.length) {
      setMessage('No candidates selected. Keep at least one checked item to apply.')
      return
    }

    updatePlan((draft) => {
      Object.assign(
        draft,
        applyIntakeResult(draft, result, ids, { defaultCaregiverId: settings.defaultCaregiverId }),
      )
    })
    setStatus('applied')
    setMessage(`Applied ${ids.length} candidate${ids.length === 1 ? '' : 's'} to the local care plan.`)
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <section className="section-block span-12">
      <SectionTitle icon={<ClipboardCheck size={20} />} title="Care Artifact Review" />
      <div className="intake-layout">
        <div>
          <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
            <FolderOpen size={18} />
            <span>Drop text, CSV, HTML, Markdown, or JSON care files here</span>
          </div>
          <div className="button-row input-actions">
            <label className="secondary-action file-button">
              <FolderOpen size={18} />
              Choose files
              <input
                multiple
                accept=".txt,.csv,.html,.htm,.md,.markdown,.json,text/*,application/json"
                type="file"
                onChange={(event) => event.target.files && void loadFiles(event.target.files)}
              />
            </label>
            <button className="secondary-action" type="button" onClick={pasteFromClipboard}>
              <ClipboardCheck size={18} />
              Read clipboard
            </button>
            <button className="secondary-action" type="button" onClick={loadSample}>
              <Sparkles size={18} />
              Load sample
            </button>
          </div>
          {fileMessage ? <p className="module-status">{fileMessage}</p> : null}
          <label className="field">
            <span>Input format</span>
            <select
              value={inputFormat}
              onChange={(event) => setInputFormat(parseCareInputFormat(event.target.value))}
            >
              <option value="auto">Auto detect</option>
              <option value="text">Plain text</option>
              <option value="html">HTML text</option>
              <option value="csv">CSV text</option>
              <option value="json">JSON care text</option>
              <option value="markdown">Markdown</option>
            </select>
          </label>
          <label className="field">
            <span>Care artifact</span>
            <textarea
              className="intake-textarea"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button className="wide-action" type="button" onClick={analyze} disabled={status === 'analyzing'}>
              <Sparkles size={18} />
              {status === 'analyzing' ? 'Reviewing' : 'Review'}
            </button>
            {status === 'analyzing' ? (
              <button className="secondary-action" type="button" onClick={cancelAnalysis}>
                <X size={18} />
                Cancel
              </button>
            ) : null}
            <button className="secondary-action" type="button" onClick={copyShareLink}>
              <Download size={18} />
              Copy small link
            </button>
          </div>
          {message ? <p className={`intake-status ${status}`}>{message}</p> : null}
          {shareMessage ? <p className="module-status">{shareMessage}</p> : null}
          <p className="inline-help">
            Private portal URLs cannot be fetched from GitHub Pages. Open the portal, then paste the rendered
            text or upload a downloaded file.
          </p>
        </div>

        <div className="intake-results" aria-live="polite">
          {result ? (
            <>
              <div className="intake-summary">
                <div>
                  <span>Detected shape</span>
                  <strong>{formatShape(result.detectedShape)}</strong>
                </div>
                <ConfidenceBadge confidence={result.confidence} level={result.confidenceLevel} />
              </div>

              <WarningList warnings={result.warnings} />

              <div className="candidate-list">
                {result.candidates.map((candidate) => (
                  <IntakeCandidateCard
                    candidate={candidate}
                    checked={Boolean(selected[candidate.id])}
                    debug={debug}
                    key={candidate.id}
                    onCheckedChange={(checked) => setSelected({ ...selected, [candidate.id]: checked })}
                  />
                ))}
              </div>

              <button
                className="wide-action"
                type="button"
                onClick={applySelected}
                disabled={!selectedCount || status === 'analyzing'}
              >
                <Check size={18} />
                Apply selected
              </button>

              {debug ? (
                <pre className="debug-box">
                  {JSON.stringify(
                    {
                      rules: result.debug.rules,
                      schemaVersion: result.schemaVersion,
                      sourceBytes: result.sourceBytes,
                      sourceHash: result.sourceHash,
                    },
                    null,
                    2,
                  )}
                </pre>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <Info size={18} />
              <span>Awaiting care artifact</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function IntakeCandidateCard({
  candidate,
  checked,
  debug,
  onCheckedChange,
}: {
  candidate: IntakeCandidate
  checked: boolean
  debug: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const fieldEntries = Object.entries(candidate.fields).filter(
    ([key]) => !['draft', 'instructions'].includes(key),
  )

  return (
    <article className="candidate-card">
      <div className="candidate-header">
        <label className="candidate-check">
          <input
            checked={checked}
            type="checkbox"
            onChange={(event) => onCheckedChange(event.target.checked)}
          />
          <span>{candidate.title}</span>
        </label>
        <ConfidenceBadge confidence={candidate.confidence} level={candidate.confidenceLevel} />
      </div>
      <p className="candidate-type">{formatCandidateType(candidate.type)}</p>
      <dl className="candidate-fields">
        {fieldEntries.slice(0, 6).map(([key, value]) => (
          <div key={key}>
            <dt>{formatFieldName(key)}</dt>
            <dd>{formatFieldValue(value)}</dd>
          </div>
        ))}
      </dl>
      <WarningList warnings={candidate.warnings} />
      <details className="decision-details">
        <summary>Why</summary>
        <ul>
          {candidate.explanation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
      {debug ? (
        <p className="candidate-debug">
          Source lines {candidate.sourceLines.join(', ')} · {candidate.id}
        </p>
      ) : null}
    </article>
  )
}

function WarningList({ warnings }: { warnings: IntakeWarning[] }) {
  if (!warnings.length) return null

  return (
    <div className="warning-list">
      {warnings.map((item) => (
        <div className={`warning-item ${item.severity}`} key={`${item.code}-${item.message}`}>
          <AlertTriangle size={16} />
          <div>
            <strong>{item.message}</strong>
            <span>{item.nextStep}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ConfidenceBadge({ confidence, level }: { confidence: number; level: 'high' | 'medium' | 'low' }) {
  return (
    <span className={`confidence-badge ${level}`}>
      {level} {Math.round(confidence * 100)}%
    </span>
  )
}

function MedicationsPanel({ plan, updatePlan }: { plan: CarePlan; updatePlan: PlanUpdater }) {
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

  async function copyDraft() {
    try {
      await copyTextToClipboard(active.draft)
      setProgress('Copied draft to clipboard.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to copy draft.')
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
            onChange={(event) => {
              const parsed = correspondenceTopicSchema.safeParse(event.target.value)
              if (parsed.success) updateCurrent((item) => (item.topic = parsed.data))
            }}
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
          <button className="secondary-action" type="button" onClick={copyDraft}>
            <ClipboardCheck size={18} />
            Copy
          </button>
        </div>
        {progress ? <p className="module-status">{progress}</p> : null}
      </section>
    </div>
  )
}

function PacketPanel({
  commit,
  plan,
  setError,
  settings,
  version,
}: {
  commit: string
  plan: CarePlan
  setError: (message: string) => void
  settings: AppSettings
  version: string
}) {
  const markdown = useMemo(
    () =>
      emergencyPacketMarkdown(plan, {
        commit,
        includeProvenance: settings.includeProvenanceInPacket,
        version,
      }),
    [commit, plan, settings.includeProvenanceInPacket, version],
  )
  const [passphrase, setPassphrase] = useState('')
  const [cryptoStatus, setCryptoStatus] = useState('')
  const [agePair, setAgePair] = useState<{ identity: string; recipient: string } | null>(null)
  const [packetStatus, setPacketStatus] = useState('')

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

  async function copyPacket() {
    try {
      await copyTextToClipboard(markdown)
      setPacketStatus('Copied packet Markdown to clipboard.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to copy packet.')
    }
  }

  function printPacket() {
    const blob = new Blob([packetHtmlFromMarkdown(markdown)], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const popup = window.open(url, '_blank', 'noopener,noreferrer')
    if (!popup) {
      URL.revokeObjectURL(url)
      setError('The print window was blocked. Allow pop-ups for this site or download the HTML packet.')
      return
    }
    window.setTimeout(() => {
      popup.print()
      URL.revokeObjectURL(url)
    }, 400)
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
          HTML export
        </button>
        <button className="wide-action" type="button" onClick={copyPacket}>
          <ClipboardCheck size={18} />
          Copy packet
        </button>
        <button className="wide-action" type="button" onClick={printPacket}>
          <Printer size={18} />
          Print packet
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
        {packetStatus ? <p className="module-status">{packetStatus}</p> : null}
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
        <div className="activity-log">
          <SectionTitle icon={<ClipboardCheck size={20} />} title="Activity Log" />
          <div className="stack">
            {plan.activityLog.slice(0, 5).map((entry) => (
              <div className="compact-card" key={entry.id}>
                <strong>{entry.summary}</strong>
                <span>{formatDateTime(entry.at)}</span>
                <p>Source {entry.sourceId}</p>
              </div>
            ))}
            {plan.activityLog.length === 0 ? (
              <div className="empty-state">
                <Info size={18} />
                <span>No intake activity yet</span>
              </div>
            ) : null}
          </div>
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

function SettingsPanel({
  commit,
  plan,
  replacePlan,
  reset,
  resetSettings,
  setError,
  settings,
  updateSettings,
  version,
}: {
  commit: string
  plan: CarePlan
  replacePlan: PlanReplacer
  reset: () => Promise<void>
  resetSettings: () => void
  setError: (message: string) => void
  settings: AppSettings
  updateSettings: (recipe: (draft: AppSettings) => void) => void
  version: string
}) {
  const [status, setStatus] = useState('')

  function exportState() {
    const state = buildStateFile(plan, settings, { commit, version })
    downloadText(
      `elder-care-workspace-${new Date().toISOString().slice(0, 10)}.json`,
      state,
      'application/json',
    )
    setStatus('Downloaded workspace state file.')
  }

  async function importState(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = parseStateFile(await file.text())
      replacePlan(parsed.carePlan)
      updateSettings((draft) => {
        Object.assign(draft, parsed.settings)
      })
      setStatus(`Imported workspace from ${file.name}.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to import workspace state.')
    } finally {
      event.target.value = ''
    }
  }

  async function resetWorkspace() {
    await reset()
    setStatus('Reset local workspace to the sample care plan.')
  }

  function resetAllSettings() {
    resetSettings()
    setStatus('Reset settings for this browser.')
  }

  return (
    <div className="panel-grid">
      <section className="section-block span-6">
        <SectionTitle icon={<Settings size={20} />} title="Settings" />
        <label className="toggle-row">
          <input
            checked={settings.autoSelectReviewCandidates}
            type="checkbox"
            onChange={(event) =>
              updateSettings((draft) => {
                draft.autoSelectReviewCandidates = event.target.checked
              })
            }
          />
          <span>Auto-select high-confidence review candidates</span>
        </label>
        <label className="toggle-row">
          <input
            checked={settings.includeProvenanceInPacket}
            type="checkbox"
            onChange={(event) =>
              updateSettings((draft) => {
                draft.includeProvenanceInPacket = event.target.checked
              })
            }
          />
          <span>Include activity provenance in emergency packets</span>
        </label>
        <label className="field">
          <span>Default caregiver for imported tasks</span>
          <select
            value={settings.defaultCaregiverId}
            onChange={(event) =>
              updateSettings((draft) => {
                draft.defaultCaregiverId = event.target.value
              })
            }
          >
            <option value="">First caregiver in plan</option>
            {plan.caregivers.map((caregiver) => (
              <option key={caregiver.id} value={caregiver.id}>
                {caregiver.name} ({caregiver.role})
              </option>
            ))}
          </select>
        </label>
        <button className="secondary-action full" type="button" onClick={resetAllSettings}>
          <RefreshCw size={18} />
          Reset settings
        </button>
      </section>

      <section className="section-block span-6">
        <SectionTitle icon={<Download size={20} />} title="Workspace Backup" />
        <button className="wide-action" type="button" onClick={exportState}>
          <Download size={18} />
          Export workspace JSON
        </button>
        <label className="file-input">
          <FolderOpen size={18} />
          Import workspace JSON
          <input accept="application/json,.json" type="file" onChange={importState} />
        </label>
        <button className="secondary-action full" type="button" onClick={() => void resetWorkspace()}>
          <RefreshCw size={18} />
          Reset workspace to sample
        </button>
        <p className="inline-help">
          Workspace exports include the care plan and browser settings. Keep the file private; it may contain
          sensitive care details.
        </p>
        {status ? <p className="module-status">{status}</p> : null}
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

function formatShape(value: string) {
  return value.replaceAll('_', ' ')
}

function formatCandidateType(value: string) {
  return value.replaceAll('_', ' ')
}

function formatFieldName(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
}

function formatFieldValue(value: string | string[] | boolean) {
  if (Array.isArray(value)) return value.join(', ') || 'none'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return value || 'none'
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
