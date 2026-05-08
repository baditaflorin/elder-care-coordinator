/// <reference types="vite/client" />

declare module 'pandoc-wasm' {
  export function convert(
    options: Record<string, unknown>,
    stdin: string | null,
    files: Record<string, string | Blob>,
  ): Promise<{ stdout: string; stderr: string }>
}
