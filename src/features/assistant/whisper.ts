export async function transcribeCareNote(file: File, onProgress: (message: string) => void) {
  const transformersUrl = 'https://esm.sh/@huggingface/transformers@4.2.0'
  const transformers = (await import(/* @vite-ignore */ transformersUrl)) as {
    env: { allowLocalModels: boolean }
    pipeline: (
      task: string,
      model: string,
      options?: Record<string, unknown>,
    ) => Promise<(input: string) => Promise<{ text?: string } | Array<{ text?: string }>>>
  }

  transformers.env.allowLocalModels = false
  onProgress('Loading Whisper transcription model...')
  const transcriber = await transformers.pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny.en', {
    dtype: 'q8',
  })

  const url = URL.createObjectURL(file)
  try {
    onProgress('Transcribing audio locally...')
    const result = await transcriber(url)
    if (Array.isArray(result)) {
      return result.map((item) => item.text ?? '').join('\n').trim()
    }
    return result.text?.trim() ?? ''
  } finally {
    URL.revokeObjectURL(url)
  }
}
