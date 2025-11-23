import {
  getHookCacheKey,
  getCachedCanResolve,
  setCachedCanResolve,
  checkHookCanResolve,
  type HookGroup,
} from '../src/index.js'

describe('hookCache', () => {
  describe('getHookCacheKey', () => {
    test('generates cache key from descriptor', () => {
      const wantedDependency = { alias: 'test-package', bareSpecifier: '1.0.0' }
      expect(getHookCacheKey(wantedDependency)).toBe('test-package@1.0.0')
    })

    test('handles scoped packages', () => {
      const wantedDependency = { alias: '@org/package', bareSpecifier: '^2.0.0' }
      expect(getHookCacheKey(wantedDependency)).toBe('@org/package@^2.0.0')
    })

    test('handles version ranges', () => {
      const wantedDependency = { alias: 'lodash', bareSpecifier: '>=4.0.0 <5.0.0' }
      expect(getHookCacheKey(wantedDependency)).toBe('lodash@>=4.0.0 <5.0.0')
    })
  })

  describe('getCachedCanResolve', () => {
    test('returns undefined for uncached hook', () => {
      const hookGroup: HookGroup = {
        canResolve: () => true,
      }
      const result = getCachedCanResolve(hookGroup, 'test@1.0.0')
      expect(result).toBeUndefined()
    })

    test('returns cached value when available', () => {
      const hookGroup: HookGroup = {
        canResolve: () => true,
      }
      setCachedCanResolve(hookGroup, 'test@1.0.0', true)
      const result = getCachedCanResolve(hookGroup, 'test@1.0.0')
      expect(result).toBe(true)
    })

    test('returns false when cached as false', () => {
      const hookGroup: HookGroup = {
        canResolve: () => true,
      }
      setCachedCanResolve(hookGroup, 'test@1.0.0', false)
      const result = getCachedCanResolve(hookGroup, 'test@1.0.0')
      expect(result).toBe(false)
    })

    test('cache is isolated per hook', () => {
      const hookGroup1: HookGroup = { canResolve: () => true }
      const hookGroup2: HookGroup = { canResolve: () => false }

      setCachedCanResolve(hookGroup1, 'pkg@1.0.0', true)
      setCachedCanResolve(hookGroup2, 'pkg@1.0.0', false)

      expect(getCachedCanResolve(hookGroup1, 'pkg@1.0.0')).toBe(true)
      expect(getCachedCanResolve(hookGroup2, 'pkg@1.0.0')).toBe(false)
    })

    test('cache is isolated per descriptor', () => {
      const hookGroup: HookGroup = { canResolve: () => true }

      setCachedCanResolve(hookGroup, 'pkg1@1.0.0', true)
      setCachedCanResolve(hookGroup, 'pkg2@1.0.0', false)

      expect(getCachedCanResolve(hookGroup, 'pkg1@1.0.0')).toBe(true)
      expect(getCachedCanResolve(hookGroup, 'pkg2@1.0.0')).toBe(false)
    })
  })

  describe('setCachedCanResolve', () => {
    test('creates new cache for hook', () => {
      const hookGroup: HookGroup = { canResolve: () => true }

      setCachedCanResolve(hookGroup, 'test@1.0.0', true)

      expect(getCachedCanResolve(hookGroup, 'test@1.0.0')).toBe(true)
    })

    test('updates existing cache entry', () => {
      const hookGroup: HookGroup = { canResolve: () => true }

      setCachedCanResolve(hookGroup, 'test@1.0.0', false)
      setCachedCanResolve(hookGroup, 'test@1.0.0', true)

      expect(getCachedCanResolve(hookGroup, 'test@1.0.0')).toBe(true)
    })

    test('allows multiple cache entries per hook', () => {
      const hookGroup: HookGroup = { canResolve: () => true }

      setCachedCanResolve(hookGroup, 'pkg1@1.0.0', true)
      setCachedCanResolve(hookGroup, 'pkg2@2.0.0', false)
      setCachedCanResolve(hookGroup, 'pkg3@3.0.0', true)

      expect(getCachedCanResolve(hookGroup, 'pkg1@1.0.0')).toBe(true)
      expect(getCachedCanResolve(hookGroup, 'pkg2@2.0.0')).toBe(false)
      expect(getCachedCanResolve(hookGroup, 'pkg3@3.0.0')).toBe(true)
    })
  })

  describe('checkHookCanResolve', () => {
    test('returns false when hook has no canResolve', async () => {
      const hookGroup: HookGroup = {}
      const wantedDependency = { alias: 'test', bareSpecifier: '1.0.0' }

      const result = await checkHookCanResolve(hookGroup, wantedDependency)

      expect(result).toBe(false)
    })

    test('calls canResolve and caches result (true)', async () => {
      let callCount = 0
      const hookGroup: HookGroup = {
        canResolve: () => {
          callCount++
          return true
        },
      }
      const wantedDependency = { alias: 'test', bareSpecifier: '1.0.0' }

      const result1 = await checkHookCanResolve(hookGroup, wantedDependency)
      const result2 = await checkHookCanResolve(hookGroup, wantedDependency)

      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(callCount).toBe(1) // Should only be called once due to caching
    })

    test('calls canResolve and caches result (false)', async () => {
      let callCount = 0
      const hookGroup: HookGroup = {
        canResolve: () => {
          callCount++
          return false
        },
      }
      const wantedDependency = { alias: 'test', bareSpecifier: '1.0.0' }

      const result1 = await checkHookCanResolve(hookGroup, wantedDependency)
      const result2 = await checkHookCanResolve(hookGroup, wantedDependency)

      expect(result1).toBe(false)
      expect(result2).toBe(false)
      expect(callCount).toBe(1) // Should only be called once due to caching
    })

    test('handles async canResolve', async () => {
      let callCount = 0
      const hookGroup: HookGroup = {
        canResolve: async () => {
          callCount++
          await new Promise(resolve => setTimeout(resolve, 10))
          return true
        },
      }
      const wantedDependency = { alias: 'test', bareSpecifier: '1.0.0' }

      const result1 = await checkHookCanResolve(hookGroup, wantedDependency)
      const result2 = await checkHookCanResolve(hookGroup, wantedDependency)

      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(callCount).toBe(1) // Should only be called once due to caching
    })

    test('different descriptors are cached separately', async () => {
      let callCount = 0
      const hookGroup: HookGroup = {
        canResolve: (descriptor) => {
          callCount++
          return descriptor.alias === 'match'
        },
      }

      const result1 = await checkHookCanResolve(hookGroup, { alias: 'match', bareSpecifier: '1.0.0' })
      const result2 = await checkHookCanResolve(hookGroup, { alias: 'no-match', bareSpecifier: '1.0.0' })
      const result3 = await checkHookCanResolve(hookGroup, { alias: 'match', bareSpecifier: '1.0.0' })

      expect(result1).toBe(true)
      expect(result2).toBe(false)
      expect(result3).toBe(true)
      expect(callCount).toBe(2) // Called for 'match' and 'no-match', but cached for second 'match'
    })

    test('uses cache key based on alias and bareSpecifier', async () => {
      let callCount = 0
      const hookGroup: HookGroup = {
        canResolve: () => {
          callCount++
          return true
        },
      }

      // Same package, different versions
      await checkHookCanResolve(hookGroup, { alias: 'test', bareSpecifier: '1.0.0' })
      await checkHookCanResolve(hookGroup, { alias: 'test', bareSpecifier: '2.0.0' })

      expect(callCount).toBe(2) // Different bareSpecifiers mean different cache keys
    })
  })
})
