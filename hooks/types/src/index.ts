import { type LockfileObject } from '@pnpm/lockfile.types'
import { type Registries, type WantedDependency } from '@pnpm/types'
import { type Resolution } from '@pnpm/resolver-base'

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

export interface TransformResolutionHookContext {
  packageName: string
  version: string
  registry: string
  wantedDependency: WantedDependency
  lockfileDir: string
  projectDir: string
}

export interface TransformResolutionHookLogger {
  info: (message: string) => void
  warn: (message: string) => void
}

export type TransformResolutionHook = (
  resolution: Resolution,
  context: TransformResolutionHookContext,
  logger: TransformResolutionHookLogger
) => Resolution | Promise<Resolution>
