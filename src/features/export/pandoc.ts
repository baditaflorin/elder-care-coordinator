export async function renderPacketWithPandoc(markdown: string) {
  const pandocUrl = 'https://esm.sh/pandoc-wasm@1.0.1'
  const pandoc = (await import(/* @vite-ignore */ pandocUrl)) as {
    convert: (
      options: Record<string, unknown>,
      stdin: string | null,
      files: Record<string, string | Blob>,
    ) => Promise<{ stdout: string; stderr: string }>
  }

  const result = await pandoc.convert(
    {
      from: 'markdown',
      to: 'html',
      standalone: true,
      'table-of-contents': false,
    },
    markdown,
    {},
  )

  if (result.stderr.trim()) {
    throw new Error(result.stderr.trim())
  }

  return result.stdout
}
