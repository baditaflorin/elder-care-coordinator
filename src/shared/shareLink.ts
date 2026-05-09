const sharePrefix = '#artifact='
const maxShareChars = 4000

export function createArtifactShareUrl(text: string, locationHref = window.location.href) {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('There is no care artifact to share yet.')
  }
  if (trimmed.length > maxShareChars) {
    throw new Error('This artifact is too large for a URL. Use a state file export instead.')
  }

  const url = new URL(locationHref)
  url.hash = `${sharePrefix}${base64UrlEncode(trimmed)}`
  return url.toString()
}

export function readArtifactFromHash(hash = window.location.hash) {
  if (!hash.startsWith(sharePrefix)) return ''
  return base64UrlDecode(hash.slice(sharePrefix.length))
}

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlDecode(value: string) {
  const padded = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
