import { pickFetcher } from '@pnpm/pick-fetcher'
import { jest } from '@jest/globals'
import { type FetchFunction, type Fetchers } from '@pnpm/fetcher-base'
import { type HookGroup } from '@pnpm/hooks.types'

// Helper to create a mock Fetchers object with only the needed fetcher
function createMockFetchers (partial: Partial<Fetchers>): Fetchers {
  const noop = jest.fn() as FetchFunction
  return {
    localTarball: noop,
    remoteTarball: noop,
    gitHostedTarball: noop,
    directory: noop as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    git: noop as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    binary: noop as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    ...partial,
  }
}

test('should pick localTarball fetcher', async () => {
  const localTarball = jest.fn() as FetchFunction
  const fetcher = await pickFetcher(createMockFetchers({ localTarball }), { tarball: 'file:is-positive-1.0.0.tgz' })
  expect(fetcher).toBe(localTarball)
})

test('should pick remoteTarball fetcher', async () => {
  const remoteTarball = jest.fn() as FetchFunction
  const fetcher = await pickFetcher(createMockFetchers({ remoteTarball }), { tarball: 'is-positive-1.0.0.tgz' })
  expect(fetcher).toBe(remoteTarball)
})

test.each([
  'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
  'https://bitbucket.org/pnpmjs/git-resolver/get/87cf6a67064d2ce56e8cd20624769a5512b83ff9.tar.gz',
  'https://gitlab.com/api/v4/projects/pnpm%2Fgit-resolver/repository/archive.tar.gz',
])('should pick gitHostedTarball fetcher', async (tarball) => {
  const gitHostedTarball = jest.fn() as FetchFunction
  const fetcher = await pickFetcher(createMockFetchers({ gitHostedTarball }), { tarball })
  expect(fetcher).toBe(gitHostedTarball)
})

test('should fail to pick fetcher if the type is not defined', async () => {
  await expect(async () => {
    // This test specifically needs an incomplete Fetchers object to test error handling
    await pickFetcher({} as any, { type: 'directory', directory: expect.anything() } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
  }).rejects.toThrow('Fetching for dependency type "directory" is not supported')
})

describe('hook.fetch support', () => {
  test('should use hook.fetch when canFetch returns true', async () => {
    const mockFetchResult = { filesIndex: {}, manifest: { name: 'test', version: '1.0.0' }, requiresBuild: false }
    const hookFetch = jest.fn(async () => mockFetchResult)
    const remoteTarball = jest.fn() as FetchFunction

    const hook: Partial<HookGroup> = {
      canFetch: () => true,
      fetch: hookFetch,
    }

    const mockFetchers = createMockFetchers({ remoteTarball })
    const fetcher = await pickFetcher(
      mockFetchers,
      { tarball: 'http://example.com/package.tgz' },
      {
        hooks: [hook as HookGroup],
        packageId: 'test-package@1.0.0',
      }
    )

    expect(typeof fetcher).toBe('function')

    // Call the fetcher and verify it uses hook.fetch
    const mockCafs = {} as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockResolution = { tarball: 'http://example.com/package.tgz' } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockFetchOpts = {} as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const result = await fetcher(mockCafs, mockResolution, mockFetchOpts)

    expect(result).toBe(mockFetchResult)
    expect(hookFetch).toHaveBeenCalledWith(
      mockCafs,
      { tarball: 'http://example.com/package.tgz' },
      mockFetchOpts,
      mockFetchers
    )
    expect(remoteTarball).not.toHaveBeenCalled()
  })

  test('should use hook.fetch when canFetch returns promise resolving to true', async () => {
    const mockFetchResult = { filesIndex: {}, manifest: { name: 'test', version: '1.0.0' }, requiresBuild: false }
    const hookFetch = jest.fn(async () => mockFetchResult)

    const hook: Partial<HookGroup> = {
      canFetch: async () => Promise.resolve(true),
      fetch: hookFetch,
    }

    const fetcher = await pickFetcher(
      createMockFetchers({}),
      { tarball: 'http://example.com/package.tgz' },
      {
        hooks: [hook as HookGroup],
        packageId: 'test-package@1.0.0',
      }
    )

    expect(typeof fetcher).toBe('function')
  })

  test('should fall through to standard fetcher when canFetch returns false', async () => {
    const hookFetch = jest.fn() as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const remoteTarball = jest.fn() as FetchFunction

    const hook: Partial<HookGroup> = {
      canFetch: () => false,
      fetch: hookFetch,
    }

    const fetcher = await pickFetcher(
      createMockFetchers({ remoteTarball }),
      { tarball: 'http://example.com/package.tgz' },
      {
        hooks: [hook as HookGroup],
        packageId: 'test-package@1.0.0',
      }
    )

    expect(fetcher).toBe(remoteTarball)
    expect(hookFetch).not.toHaveBeenCalled()
  })

  test('should skip hook without canFetch method', async () => {
    const remoteTarball = jest.fn() as FetchFunction

    const hook: Partial<HookGroup> = {
      // No canFetch method
      fetch: jest.fn() as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const fetcher = await pickFetcher(
      createMockFetchers({ remoteTarball }),
      { tarball: 'http://example.com/package.tgz' },
      {
        hooks: [hook as HookGroup],
        packageId: 'test-package@1.0.0',
      }
    )

    expect(fetcher).toBe(remoteTarball)
  })

  test('should check hooks in order and use first match', async () => {
    const mockFetchResult1 = { filesIndex: {}, manifest: { name: 'hook1', version: '1.0.0' }, requiresBuild: false }
    const mockFetchResult2 = { filesIndex: {}, manifest: { name: 'hook2', version: '1.0.0' }, requiresBuild: false }

    const hook1: Partial<HookGroup> = {
      canFetch: () => true,
      fetch: jest.fn(async () => mockFetchResult1),
    }

    const hook2: Partial<HookGroup> = {
      canFetch: () => true,
      fetch: jest.fn(async () => mockFetchResult2),
    }

    const fetcher = await pickFetcher(
      createMockFetchers({}),
      { tarball: 'http://example.com/package.tgz' },
      {
        hooks: [hook1 as HookGroup, hook2 as HookGroup],
        packageId: 'test-package@1.0.0',
      }
    )

    const mockCafs = {} as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockResolution = { tarball: 'http://example.com/package.tgz' } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockFetchOpts = {} as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const result = await fetcher(mockCafs, mockResolution, mockFetchOpts)

    expect(result).toBe(mockFetchResult1)
    expect(hook1.fetch).toHaveBeenCalled()
    expect(hook2.fetch).not.toHaveBeenCalled()
  })

  test('should require packageId for hook.fetch', async () => {
    const remoteTarball = jest.fn() as FetchFunction

    const hook: Partial<HookGroup> = {
      canFetch: () => true,
      fetch: jest.fn() as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const fetcher = await pickFetcher(
      createMockFetchers({ remoteTarball }),
      { tarball: 'http://example.com/package.tgz' },
      {
        hooks: [hook as HookGroup],
        // No packageId
      }
    )

    // Should fall back to standard fetcher without packageId
    expect(fetcher).toBe(remoteTarball)
  })

  test('should handle custom resolution types', async () => {
    const mockFetchResult = { filesIndex: {}, manifest: { name: 'test', version: '1.0.0' }, requiresBuild: false }
    const hookFetch = jest.fn(async () => mockFetchResult)

    const hook: Partial<HookGroup> = {
      canFetch: (pkgId: string, resolution: any) => resolution.type === '@test/custom', // eslint-disable-line @typescript-eslint/no-explicit-any
      fetch: hookFetch,
    }

    const mockFetchers = createMockFetchers({})
    const fetcher = await pickFetcher(
      mockFetchers,
      { type: '@test/custom', customField: 'value' } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      {
        hooks: [hook as HookGroup],
        packageId: 'test-package@1.0.0',
      }
    )

    const mockCafs = {} as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockResolution = { type: '@test/custom', customField: 'value' } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockFetchOpts = {} as any // eslint-disable-line @typescript-eslint/no-explicit-any

    await fetcher(mockCafs, mockResolution, mockFetchOpts)

    expect(hookFetch).toHaveBeenCalledWith(
      mockCafs,
      { type: '@test/custom', customField: 'value' },
      mockFetchOpts,
      mockFetchers
    )
  })

  test('should pass all fetch options to hook.fetch', async () => {
    const hookFetch = jest.fn(async () => ({ filesIndex: {}, manifest: { name: 'test', version: '1.0.0' }, requiresBuild: false }))

    const hook: Partial<HookGroup> = {
      canFetch: () => true,
      fetch: hookFetch,
    }

    const mockFetchers = createMockFetchers({})
    const fetcher = await pickFetcher(
      mockFetchers,
      { tarball: 'http://example.com/package.tgz' },
      {
        hooks: [hook as HookGroup],
        packageId: 'test-package@1.0.0',
        lockfileDir: '/project',
      }
    )

    const mockCafs = { addFilesFromTarball: jest.fn() } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockResolution = { tarball: 'http://example.com/package.tgz' } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const mockFetchOpts = {
      onStart: jest.fn(),
      onProgress: jest.fn(),
      readManifest: true,
      filesIndexFile: 'index.json',
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    await fetcher(mockCafs, mockResolution, mockFetchOpts)

    expect(hookFetch).toHaveBeenCalledWith(mockCafs, mockResolution, mockFetchOpts, mockFetchers)
  })
})
