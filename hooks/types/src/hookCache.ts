import { type HookGroup, type WantedDependency } from './index.js'

// Shared cache for canResolve results to avoid calling expensive async operations twice
// WeakMap ensures automatic garbage collection when hook groups are no longer referenced
const hookGroupCanResolveCache = new WeakMap<HookGroup, Map<string, boolean>>()

export function getHookCacheKey (wantedDependency: WantedDependency): string {
  const alias = wantedDependency.alias ?? ''
  const bareSpecifier = wantedDependency.bareSpecifier ?? ''
  return `${alias}@${bareSpecifier}`
}

export function getCachedCanResolve (hookGroup: HookGroup, cacheKey: string): boolean | undefined {
  return hookGroupCanResolveCache.get(hookGroup)?.get(cacheKey)
}

export function setCachedCanResolve (hookGroup: HookGroup, cacheKey: string, value: boolean): void {
  let cache = hookGroupCanResolveCache.get(hookGroup)
  if (!cache) {
    cache = new Map<string, boolean>()
    hookGroupCanResolveCache.set(hookGroup, cache)
  }
  cache.set(cacheKey, value)
}

/**
 * Check if a hook group can resolve a wanted dependency, using cache when available
 * This centralizes the cache check/call/store logic
 */
export async function checkHookCanResolve (
  hookGroup: HookGroup,
  wantedDependency: WantedDependency
): Promise<boolean> {
  if (!hookGroup.canResolve) return false

  const cacheKey = getHookCacheKey(wantedDependency)

  // Check cache first
  const cached = getCachedCanResolve(hookGroup, cacheKey)
  if (cached !== undefined) return cached

  // Call canResolve and handle sync/async (await works for both)
  const canResolve = await hookGroup.canResolve(wantedDependency)

  // Cache the result
  setCachedCanResolve(hookGroup, cacheKey, canResolve)

  return canResolve
}
