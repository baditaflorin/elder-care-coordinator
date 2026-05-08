import {
  CalendarDays,
  Download,
  ExternalLink,
  HeartHandshake,
  Pill,
  ShieldCheck,
} from 'lucide-react'
import type { ReactNode } from 'react'

type AppProps = {
  version: string
  commit: string
}

const repoUrl = 'https://github.com/baditaflorin/elder-care-coordinator'
const paypalUrl = 'https://www.paypal.com/paypalme/florinbadita'

function App({ version, commit }: AppProps) {
  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-800 text-white">
              <HeartHandshake aria-hidden="true" size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
                Elder Care Coordinator
              </p>
              <p className="text-xs text-slate-600">
                v{version} · commit {commit}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a className="icon-link" href={repoUrl} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" size={18} />
              <span>Star on GitHub</span>
            </a>
            <a className="icon-link" href={paypalUrl} target="_blank" rel="noreferrer">
              <HeartHandshake aria-hidden="true" size={18} />
              <span>Support via PayPal</span>
            </a>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-md bg-teal-50 px-3 py-1 text-sm font-medium text-teal-900 ring-1 ring-teal-200">
              Local-first, private by default, static on GitHub Pages
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              A calm command center for family elder care.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              Replace the medication app pile, appointment notes, insurance email drafts,
              and family chat scrollback with one offline-ready care workspace.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Capability
                icon={<Pill aria-hidden="true" size={22} />}
                label="Medication schedules"
                value="Track doses, prescribers, refills, and adherence handoffs."
              />
              <Capability
                icon={<CalendarDays aria-hidden="true" size={22} />}
                label="Appointment tracking"
                value="Prepare questions, tasks, transport notes, and follow-ups."
              />
              <Capability
                icon={<ShieldCheck aria-hidden="true" size={22} />}
                label="Emergency packet"
                value="Export encrypted and printable packets for real-world use."
              />
            </div>
          </div>

          <section aria-label="Care dashboard preview" className="care-panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Today</h2>
                <p className="text-sm text-slate-600">Friday, May 8, 2026</p>
              </div>
              <button className="primary-action" type="button">
                <Download aria-hidden="true" size={18} />
                Packet
              </button>
            </div>
            <div className="space-y-3">
              {[
                ['8:00 AM', 'Metformin 500mg', 'Taken by Ana'],
                ['11:30 AM', 'Cardiology visit prep', 'Bring BP log + insurance card'],
                ['2:00 PM', 'Call insurer', 'Draft appeal letter ready'],
                ['8:00 PM', 'Lisinopril 10mg', 'Needs confirmation'],
              ].map(([time, title, detail]) => (
                <div className="timeline-row" key={title}>
                  <span className="time-chip">{time}</span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-slate-600">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function Capability({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-900">
        {icon}
      </div>
      <h2 className="font-semibold text-slate-950">{label}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  )
}

export default App
