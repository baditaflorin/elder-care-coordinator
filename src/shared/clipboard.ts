export async function copyTextToClipboard(text: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard copy is not available in this browser. Select the text and copy it manually.')
  }
  await navigator.clipboard.writeText(text)
}

export async function readTextFromClipboard() {
  if (!navigator.clipboard?.readText) {
    throw new Error('Clipboard read is not available in this browser. Use the paste box instead.')
  }
  const text = await navigator.clipboard.readText()
  if (!text.trim()) {
    throw new Error(
      'Clipboard is empty. Copy a medication list, denial, appointment reminder, or family chat first.',
    )
  }
  return text
}
