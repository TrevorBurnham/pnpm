import { type LockfileObject } from '@pnpm/lockfile.types'
import { type Resolution, type WantedDependency } from '@pnpm/resolver-base'
import { type Registries } from '@pnpm/types'
import { type Cafs } from '@pnpm/cafs-types'
import { type FetchOptions, type FetchResult, type Fetchers } from '@pnpm/fetcher-base'

// Custom resolution types must use scoped naming to avoid conflicts with pnpm's built-in types
export type CustomResolutionType = `@${string}/${string}`

// preResolution hook
export interface PreResolutionHookContext {
  wantedLockfile: LockfileObject
  currentLockfile: LockfileObject
  existsCurrentLockfile: boolean
  existsNonEmptyWantedLockfile: boolean
  lockfileDir: string
  storeDir: string
  registries: Registries
}

export interface PreResolutionHookLogger {
  info: (message: string) => void
  warn: (message: string) => void
}

export type PreResolutionHook = (ctx: PreResolutionHookContext, logger: PreResolutionHookLogger) => Promise<void>

// Hook groups - unified hook interface
export type { WantedDependency }

export interface ResolveOptions {
  lockfileDir: string
  projectDir: string
  preferredVersions: Record<string, string>
}

export interface ResolveResult {
  id: string
  resolution: Resolution
}

/**
 * A hook group can contain any combination of hooks.
 * Multiple hook groups can be provided and will be evaluated in order.
 */
export interface HookGroup {
  // Resolution hooks
  canResolve?: (wantedDependency: WantedDependency) => boolean | Promise<boolean>
  resolve?: (wantedDependency: WantedDependency, opts: ResolveOptions) => ResolveResult | Promise<ResolveResult>
  shouldForceResolve?: (wantedDependency: WantedDependency) => boolean | Promise<boolean>

  // Fetch hooks
  canFetch?: (pkgId: string, resolution: Resolution) => boolean | Promise<boolean>
  fetch?: (cafs: Cafs, resolution: Resolution, opts: FetchOptions, fetchers: Fetchers) => FetchResult | Promise<FetchResult>

  // Config hook
  /**
   * Hook to modify pnpm configuration.
   *
   * Note: The config parameter is actually the Config type from @pnpm/config,
   * but we use `any` here to avoid circular dependencies. Hook implementations
   * can safely cast it to the full Config type.
   *
   * @param config - The pnpm configuration object
   * @returns The modified configuration object
   */
  updateConfig?: (config: any) => any | Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
}

export {
  getHookCacheKey,
  getCachedCanResolve,
  setCachedCanResolve,
  checkHookCanResolve,
} from './hookCache.js'
