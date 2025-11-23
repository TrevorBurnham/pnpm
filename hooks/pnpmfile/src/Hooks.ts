import {
  type PreResolutionHook,
  type HookGroup,
} from '@pnpm/hooks.types'
import { type LockfileObject } from '@pnpm/lockfile.types'
import { type BaseManifest } from '@pnpm/types'
import { type Log } from '@pnpm/core-loggers'
import { type CustomFetchers } from '@pnpm/fetcher-base'
import { type ImportIndexedPackageAsync } from '@pnpm/store-controller-types'

export interface HookContext {
  log: (message: string) => void
}

export type ReadPackageHookFunction = <Pkg extends BaseManifest>(pkg: Pkg, context: HookContext) => Pkg | Promise<Pkg>

export interface Hooks {
  readPackage?: ReadPackageHookFunction
  preResolution?: PreResolutionHook
  afterAllResolved?: (lockfile: LockfileObject, context: HookContext) => LockfileObject | Promise<LockfileObject>
  filterLog?: (log: Log) => boolean
  importPackage?: ImportIndexedPackageAsync
  fetchers?: CustomFetchers
  /**
   * Hook groups - unified hook interface.
   * Each element can contain any combination of hooks (canResolve, resolve, canFetch, fetch, shouldForceResolve, updateConfig).
   * Hook groups are evaluated in order.
   */
  hooks?: HookGroup[]
}
