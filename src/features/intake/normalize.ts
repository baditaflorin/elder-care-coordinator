export const maxInputBytes = 1024 * 1024
export const largeInputWarningBytes = 250 * 1024

const smartCharacters: Array<[RegExp, string]> = [
  [/[\u2018\u2019\u201A\u201B]/g, "'"],
  [/[\u201C\u201D\u201E\u201F]/g, '"'],
  [/[\u2013\u2014]/g, '-'],
  [/\u00A0/g, ' '],
  [/[\u200E\u200F\u202A-\u202E]/g, ''],
]

export function normalizeCareText(input: string) {
  let text = input.replace(/^\uFEFF/, '').normalize('NFKC')
  for (const [pattern, replacement] of smartCharacters) {
    text = text.replace(pattern, replacement)
  }

  text = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text
}

export function byteLength(input: string) {
  return new TextEncoder().encode(input).byteLength
}
