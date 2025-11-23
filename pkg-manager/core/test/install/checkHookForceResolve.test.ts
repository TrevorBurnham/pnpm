import { checkHookForceResolve, type ProjectWithManifest } from '../../src/install/checkHookForceResolve.js'
import { type HookGroup } from '@pnpm/hooks.types'
import { type LockfileObject } from '@pnpm/lockfile.types'
import { type ProjectId } from '@pnpm/types'

describe('checkHookForceResolve', () => {
  test('returns false when no hooks provided', async () => {
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {},
    }
    const projects: ProjectWithManifest[] = []

    const result = await checkHookForceResolve([], lockfile, projects)

    expect(result).toBe(false)
  })

  test('returns false when no projects provided', async () => {
    const hookGroup: HookGroup = {
      canResolve: () => true,
      shouldForceResolve: () => true,
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {},
    }

    const result = await checkHookForceResolve([hookGroup], lockfile, [])

    expect(result).toBe(false)
  })

  test('returns false when hook canResolve returns false', async () => {
    const hookGroup: HookGroup = {
      canResolve: () => false,
      shouldForceResolve: () => true,
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          dependencies: {
            'test-pkg': '/test-pkg@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/test-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/test-pkg-1.0.0.tgz', integrity: 'sha512-test' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          dependencies: {
            'test-pkg': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(false)
  })

  test('returns false when hook has no shouldForceResolve', async () => {
    const hookGroup: HookGroup = {
      canResolve: () => true,
      // No shouldForceResolve
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          dependencies: {
            'test-pkg': '/test-pkg@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/test-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/test-pkg-1.0.0.tgz', integrity: 'sha512-test' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          dependencies: {
            'test-pkg': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(false)
  })

  test('returns false when shouldForceResolve returns false', async () => {
    const hookGroup: HookGroup = {
      canResolve: () => true,
      shouldForceResolve: () => false,
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          dependencies: {
            'test-pkg': '/test-pkg@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/test-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/test-pkg-1.0.0.tgz', integrity: 'sha512-test' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          dependencies: {
            'test-pkg': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(false)
  })

  test('returns true when shouldForceResolve returns true', async () => {
    const hookGroup: HookGroup = {
      canResolve: (wantedDependency) => wantedDependency.alias === 'test-pkg',
      shouldForceResolve: () => true,
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          dependencies: {
            'test-pkg': '/test-pkg@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/test-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/test-pkg-1.0.0.tgz', integrity: 'sha512-test' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          dependencies: {
            'test-pkg': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(true)
  })

  test('checks devDependencies', async () => {
    const hookGroup: HookGroup = {
      canResolve: (wantedDependency) => wantedDependency.alias === 'dev-pkg',
      shouldForceResolve: () => true,
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          devDependencies: {
            'dev-pkg': '/dev-pkg@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/dev-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/dev-pkg-1.0.0.tgz', integrity: 'sha512-test' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          devDependencies: {
            'dev-pkg': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(true)
  })

  test('checks optionalDependencies', async () => {
    const hookGroup: HookGroup = {
      canResolve: (wantedDependency) => wantedDependency.alias === 'opt-pkg',
      shouldForceResolve: () => true,
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          optionalDependencies: {
            'opt-pkg': '/opt-pkg@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/opt-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/opt-pkg-1.0.0.tgz', integrity: 'sha512-test' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          optionalDependencies: {
            'opt-pkg': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(true)
  })

  test('checks peerDependencies', async () => {
    const hookGroup: HookGroup = {
      canResolve: (wantedDependency) => wantedDependency.alias === 'peer-pkg',
      shouldForceResolve: () => true,
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          peerDependencies: {
            'peer-pkg': '/peer-pkg@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/peer-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/peer-pkg-1.0.0.tgz', integrity: 'sha512-test' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          peerDependencies: {
            'peer-pkg': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(true)
  })

  test('checks all dependency types together', async () => {
    const hookGroup: HookGroup = {
      canResolve: () => true,
      shouldForceResolve: (wantedDependency) => wantedDependency.alias === 'peer-pkg',
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          dependencies: {
            'reg-pkg': '/reg-pkg@1.0.0',
          },
          devDependencies: {
            'dev-pkg': '/dev-pkg@1.0.0',
          },
          optionalDependencies: {
            'opt-pkg': '/opt-pkg@1.0.0',
          },
          peerDependencies: {
            'peer-pkg': '/peer-pkg@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/reg-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/reg-pkg@1.0.0.tgz', integrity: 'sha512-test1' },
        },
        '/dev-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/dev-pkg-1.0.0.tgz', integrity: 'sha512-test2' },
        },
        '/opt-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/opt-pkg-1.0.0.tgz', integrity: 'sha512-test3' },
        },
        '/peer-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/peer-pkg-1.0.0.tgz', integrity: 'sha512-test4' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          dependencies: {
            'reg-pkg': '1.0.0',
          },
          devDependencies: {
            'dev-pkg': '1.0.0',
          },
          optionalDependencies: {
            'opt-pkg': '1.0.0',
          },
          peerDependencies: {
            'peer-pkg': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(true)
  })

  test('handles multiple projects', async () => {
    const hookGroup: HookGroup = {
      canResolve: (wantedDependency) => wantedDependency.alias === 'pkg-b',
      shouldForceResolve: () => true,
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        'project-a': {
          dependencies: {
            'pkg-a': '/pkg-a@1.0.0',
          },
        },
        'project-b': {
          dependencies: {
            'pkg-b': '/pkg-b@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/pkg-a@1.0.0': {
          resolution: { tarball: 'http://example.com/pkg-a-1.0.0.tgz', integrity: 'sha512-test1' },
        },
        '/pkg-b@1.0.0': {
          resolution: { tarball: 'http://example.com/pkg-b-1.0.0.tgz', integrity: 'sha512-test2' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: 'project-a' as ProjectId,
        manifest: {
          dependencies: {
            'pkg-a': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      {
        id: 'project-b' as ProjectId,
        manifest: {
          dependencies: {
            'pkg-b': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(true)
  })

  test('handles multiple hooks - first matching returns true', async () => {
    const hookGroup1: HookGroup = {
      canResolve: () => false,
      shouldForceResolve: () => true,
    }
    const hookGroup2: HookGroup = {
      canResolve: () => true,
      shouldForceResolve: () => true,
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          dependencies: {
            'test-pkg': '/test-pkg@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/test-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/test-pkg-1.0.0.tgz', integrity: 'sha512-test' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          dependencies: {
            'test-pkg': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    ]

    const result = await checkHookForceResolve([hookGroup1, hookGroup2], lockfile, projects)

    expect(result).toBe(true)
  })

  test('handles async shouldForceResolve', async () => {
    const hookGroup: HookGroup = {
      canResolve: () => true,
      shouldForceResolve: async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return true
      },
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          dependencies: {
            'test-pkg': '/test-pkg@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/test-pkg@1.0.0': {
          resolution: { tarball: 'http://example.com/test-pkg-1.0.0.tgz', integrity: 'sha512-test' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          dependencies: {
            'test-pkg': '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(true)
  })

  test('short-circuits on first true result', async () => {
    let callCount = 0
    const hookGroup: HookGroup = {
      canResolve: () => true,
      shouldForceResolve: () => {
        callCount++
        return callCount === 1 // First call returns true
      },
    }
    const lockfile: LockfileObject = {
      lockfileVersion: '9.0',
      importers: {
        '.': {
          dependencies: {
            pkg1: '/pkg1@1.0.0',
            pkg2: '/pkg2@1.0.0',
            pkg3: '/pkg3@1.0.0',
          },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      packages: {
        '/pkg1@1.0.0': {
          resolution: { tarball: 'http://example.com/pkg1-1.0.0.tgz', integrity: 'sha512-test1' },
        },
        '/pkg2@1.0.0': {
          resolution: { tarball: 'http://example.com/pkg2-1.0.0.tgz', integrity: 'sha512-test2' },
        },
        '/pkg3@1.0.0': {
          resolution: { tarball: 'http://example.com/pkg3-1.0.0.tgz', integrity: 'sha512-test3' },
        },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const projects: ProjectWithManifest[] = [
      {
        id: '.' as ProjectId,
        manifest: {
          dependencies: {
            pkg1: '1.0.0',
            pkg2: '1.0.0',
            pkg3: '1.0.0',
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    ]

    const result = await checkHookForceResolve([hookGroup], lockfile, projects)

    expect(result).toBe(true)
    expect(callCount).toBe(1) // Should stop after first true
  })
})
