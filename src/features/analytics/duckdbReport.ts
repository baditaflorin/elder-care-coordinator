import { careLoad } from '../care-plan/planner'
import type { CarePlan } from '../care-plan/types'

export type LocalReport = {
  medicationCount: number
  openTaskCount: number
  upcomingAppointmentCount: number
  refillsDueSoon: number
  engine: 'duckdb-wasm' | 'typescript-fallback'
}

export async function buildLocalReport(plan: CarePlan): Promise<LocalReport> {
  try {
    const duckdb = (await import('@duckdb/duckdb-wasm')) as unknown as {
      getJsDelivrBundles: () => unknown
      selectBundle: (bundles: unknown) => Promise<{ mainWorker: string; mainModule: string; pthreadWorker?: string }>
      ConsoleLogger: new () => unknown
      AsyncDuckDB: new (
        logger: unknown,
        worker: Worker,
      ) => {
        instantiate: (mainModule: string, pthreadWorker?: string) => Promise<unknown>
        connect: () => Promise<{
          query: (sql: string) => Promise<{ toArray: () => Array<{ toJSON: () => Record<string, unknown> }> }>
          close: () => Promise<void>
        }>
        registerFileText: (name: string, text: string) => Promise<void>
        terminate: () => Promise<void>
      }
    }

    const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles())
    const worker = new Worker(bundle.mainWorker, { type: 'module' })
    const database = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker)
    await database.instantiate(bundle.mainModule, bundle.pthreadWorker)
    await database.registerFileText('medications.json', JSON.stringify(plan.medications))
    await database.registerFileText('tasks.json', JSON.stringify(plan.tasks))
    await database.registerFileText('appointments.json', JSON.stringify(plan.appointments))
    const connection = await database.connect()

    try {
      const table = await connection.query(`
        WITH meds AS (SELECT * FROM read_json_auto('medications.json')),
        tasks AS (SELECT * FROM read_json_auto('tasks.json')),
        appts AS (SELECT * FROM read_json_auto('appointments.json'))
        SELECT
          (SELECT count(*) FROM meds) AS medicationCount,
          (SELECT count(*) FROM tasks WHERE status != 'done') AS openTaskCount,
          (SELECT count(*) FROM appts) AS upcomingAppointmentCount,
          (SELECT count(*) FROM meds WHERE refillBy <= current_date + INTERVAL 14 DAYS) AS refillsDueSoon
      `)
      const row = table.toArray()[0]?.toJSON() ?? {}
      return {
        medicationCount: Number(row.medicationCount ?? 0),
        openTaskCount: Number(row.openTaskCount ?? 0),
        upcomingAppointmentCount: Number(row.upcomingAppointmentCount ?? 0),
        refillsDueSoon: Number(row.refillsDueSoon ?? 0),
        engine: 'duckdb-wasm',
      }
    } finally {
      await connection.close()
      await database.terminate()
    }
  } catch {
    const load = careLoad(plan)
    return {
      medicationCount: plan.medications.length,
      openTaskCount: load.openTasks,
      upcomingAppointmentCount: load.appointments,
      refillsDueSoon: plan.medications.filter((medication) => {
        const refillDate = new Date(`${medication.refillBy}T12:00:00`)
        const soon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        return refillDate <= soon
      }).length,
      engine: 'typescript-fallback',
    }
  }
}
