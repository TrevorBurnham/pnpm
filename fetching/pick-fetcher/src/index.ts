import type { AtomicResolution } from '@pnpm/resolver-base'
import type { Fetchers, FetchFunction, DirectoryFetcher, GitFetcher, BinaryFetcher, FetchOptions } from '@pnpm/fetcher-base'
import type { Cafs } from '@pnpm/cafs-types'
import { type HookGroup } from '@pnpm/hooks.types'

export async function pickFetcher (
  fetcherByHostingType: Fetchers,
  resolution: AtomicResolution,
  opts?: {
    hooks?: HookGroup[]
    packageId?: string
    lockfileDir?: string
  }
): Promise<FetchFunction | DirectoryFetcher | GitFetcher | BinaryFetcher> {
  // Try hook.fetch from hook groups first if available
  // Hook groups can provide custom fetch implementations
  if (opts?.hooks && opts.hooks.length > 0 && opts.packageId) {
    for (const hookGroup of opts.hooks) {
      if (hookGroup.canFetch && hookGroup.fetch) {
        // eslint-disable-next-line no-await-in-loop
        const canFetch = await hookGroup.canFetch(opts.packageId, resolution)

        if (canFetch) {
          // Return a wrapper FetchFunction that calls the hook's fetch method
          // The hook.fetch receives cafs, resolution, opts, and the standard fetchers for delegation
          return async (cafs: Cafs, _resolution: AtomicResolution, fetchOpts: FetchOptions) => {
            return hookGroup.fetch!(cafs, resolution, fetchOpts, fetcherByHostingType)
          }
        }
      }
    }
  }

  // No hook handled the fetch, use standard fetcher selection
  let fetcherType: keyof Fetchers | undefined

  // Determine the fetcher type based on resolution
  if (resolution.type == null) {
    // Tarball resolution without explicit type
    if ('tarball' in resolution && resolution.tarball) {
      if (resolution.tarball.startsWith('file:')) {
        fetcherType = 'localTarball'
      } else if (isGitHostedPkgUrl(resolution.tarball)) {
        fetcherType = 'gitHostedTarball'
      } else {
        fetcherType = 'remoteTarball'
      }
    }
  } else if (resolution.type === 'directory' || resolution.type === 'git' || resolution.type === 'binary') {
    // Standard resolution types that map directly to fetchers
    fetcherType = resolution.type
  } else {
    // Custom resolution type that wasn't handled by any hook
    throw new Error(
      `Cannot fetch dependency with custom resolution type "${resolution.type}". ` +
      'Custom resolutions must be handled by fetch hooks.'
    )
  }

  const fetch = fetcherType != null ? fetcherByHostingType[fetcherType] : undefined

  if (!fetch) {
    throw new Error(`Fetching for dependency type "${resolution.type ?? 'tarball'}" is not supported`)
  }

  return fetch
}

export function isGitHostedPkgUrl (url: string): boolean {
  return (
    url.startsWith('https://codeload.github.com/') ||
    url.startsWith('https://bitbucket.org/') ||
    url.startsWith('https://gitlab.com/')
  ) && url.includes('tar.gz')
}
