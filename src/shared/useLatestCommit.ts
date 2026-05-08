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
      const payload = (await response.json()) as { sha?: string }
      return payload.sha?.slice(0, 7) || fallback
    },
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 15,
  })

  return query.data ?? fallback
}
