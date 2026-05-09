import { openDB, type DBSchema } from 'idb'
import * as Y from 'yjs'
import { carePlanSchema, type CarePlan } from '../care-plan/types'
import { migrateCarePlan } from './migrations'

const dbName = 'elder-care-coordinator'
const storeName = 'care-documents'
const activeKey = 'active'

type StoredCarePlan = {
  id: string
  savedAt: string
  snapshot: CarePlan
  yUpdate: Uint8Array
}

interface CareCoordinatorDB extends DBSchema {
  [storeName]: {
    key: string
    value: StoredCarePlan
  }
}

async function db() {
  return openDB<CareCoordinatorDB>(dbName, 1, {
    upgrade(database) {
      database.createObjectStore(storeName, { keyPath: 'id' })
    },
  })
}

export async function loadCarePlan() {
  const database = await db()
  const stored = await database.get(storeName, activeKey)
  if (!stored) return null

  try {
    return decodeYUpdate(stored.yUpdate)
  } catch {
    return migrateCarePlan(stored.snapshot)
  }
}

export async function saveCarePlan(plan: CarePlan) {
  const database = await db()
  const snapshot = carePlanSchema.parse(plan)
  await database.put(storeName, {
    id: activeKey,
    savedAt: new Date().toISOString(),
    snapshot,
    yUpdate: encodeYUpdate(snapshot),
  })
}

export async function clearCarePlan() {
  const database = await db()
  await database.delete(storeName, activeKey)
}

export function encodeYUpdate(plan: CarePlan) {
  const doc = new Y.Doc()
  doc.getMap('care').set('snapshot', plan)
  return Y.encodeStateAsUpdate(doc)
}

export function decodeYUpdate(update: Uint8Array) {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, update)
  const snapshot = doc.getMap('care').get('snapshot')
  return migrateCarePlan(snapshot)
}
