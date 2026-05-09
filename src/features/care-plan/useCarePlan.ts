import { useCallback, useEffect, useMemo, useState } from 'react'
import { clearCarePlan, loadCarePlan, saveCarePlan } from '../storage/careStore'
import { sampleCarePlan } from './sample'
import { carePlanSchema, type CarePlan } from './types'

type LoadState = 'loading' | 'ready' | 'error'

export function useCarePlan() {
  const [plan, setPlan] = useState<CarePlan>(sampleCarePlan)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [lastSavedAt, setLastSavedAt] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    loadCarePlan()
      .then((stored) => {
        if (cancelled) return
        setPlan(stored ?? sampleCarePlan)
        setLoadState('ready')
      })
      .catch((caught: unknown) => {
        if (cancelled) return
        setError(caught instanceof Error ? caught.message : 'Unable to load care plan.')
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (loadState !== 'ready') return
    const timer = window.setTimeout(() => {
      saveCarePlan(plan)
        .then(() => setLastSavedAt(new Date().toISOString()))
        .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Unable to save.'))
    }, 450)

    return () => window.clearTimeout(timer)
  }, [loadState, plan])

  const updatePlan = useCallback((recipe: (draft: CarePlan) => void) => {
    setPlan((current) => {
      const draft = structuredClone(current)
      recipe(draft)
      draft.updatedAt = new Date().toISOString()
      return carePlanSchema.parse(draft)
    })
  }, [])

  const replacePlan = useCallback((nextPlan: CarePlan) => {
    setPlan(carePlanSchema.parse({ ...nextPlan, updatedAt: new Date().toISOString() }))
  }, [])

  const reset = useCallback(async () => {
    await clearCarePlan()
    setPlan(sampleCarePlan)
    setLastSavedAt('')
  }, [])

  return useMemo(
    () => ({ error, lastSavedAt, loadState, plan, replacePlan, reset, setError, updatePlan }),
    [error, lastSavedAt, loadState, plan, replacePlan, reset, updatePlan],
  )
}
