import { buildInsuranceDraft } from '../care-plan/planner'
import type { CarePlan, CorrespondenceTopic } from '../care-plan/types'

export function fallbackCorrespondenceDraft(plan: CarePlan, topic: CorrespondenceTopic, facts: string) {
  return buildInsuranceDraft(plan, topic, facts)
}

export async function improveDraftWithLocalLlm(
  plan: CarePlan,
  draft: string,
  onProgress: (message: string) => void,
) {
  if (!('gpu' in navigator)) {
    throw new Error('This browser does not expose WebGPU for local LLM drafting.')
  }

  const webllmUrl = 'https://esm.sh/@mlc-ai/web-llm@0.2.83'
  const webllm = (await import(/* @vite-ignore */ webllmUrl)) as {
    CreateMLCEngine: (
      model: string,
      options: { initProgressCallback?: (progress: { text?: string }) => void },
    ) => Promise<{
      chat: {
        completions: {
          create: (request: {
            messages: Array<{ role: 'system' | 'user'; content: string }>
            temperature: number
          }) => Promise<{ choices: Array<{ message?: { content?: string } }> }>
        }
      }
      unload?: () => Promise<void>
    }>
  }

  onProgress('Loading local drafting model...')
  const engine = await webllm.CreateMLCEngine('Llama-3.2-1B-Instruct-q4f32_1-MLC', {
    initProgressCallback: (progress) => {
      if (progress.text) onProgress(progress.text)
    },
  })

  const completion = await engine.chat.completions.create({
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You help family caregivers write clear administrative letters. Do not provide medical advice. Preserve facts and use a concise, respectful tone.',
      },
      {
        role: 'user',
        content: `Care recipient: ${plan.recipient.name}\nInsurer: ${plan.recipient.insurer}\nDraft:\n${draft}`,
      },
    ],
  })

  await engine.unload?.()
  return completion.choices[0]?.message?.content?.trim() || draft
}
