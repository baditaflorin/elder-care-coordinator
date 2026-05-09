export function stableHash(input: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function stableId(prefix: string, parts: Array<string | number | boolean | undefined>) {
  return `${prefix}_${stableHash(parts.map((part) => String(part ?? '')).join('|'))}`
}
