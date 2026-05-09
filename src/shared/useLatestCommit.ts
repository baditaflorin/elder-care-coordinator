import { useQuery } from '@tanstack/react-query'

const commitApiUrl = 'https://api.github.com/repos/baditaflorin/elder-care-coordinator/commits/main'

export function useLatestCommit(fallback: string) {
  const query = useQuery({
    queryKey: ['github-latest-commit', 'baditaflorin/elder-care-coordinator', 'main'],
    queryFn: async () => {
      const response = await fetch(commitApiUrl, {
        headers: { Accept: 'application/vnd.github+json' },
      })
      if (!response.ok) throw new Error('Unable to fetch latest commit.')
      const payload: unknown = await response.json()
      if (isCommitPayload(payload)) return payload.sha.slice(0, 7)
      return fallback
    },
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 15,
  })

  return query.data ?? fallback
}

function isCommitPayload(value: unknown): value is { sha: string } {
  if (typeof value !== 'object' || value === null) return false
  return typeof Object.getOwnPropertyDescriptor(value, 'sha')?.value === 'string'
}
