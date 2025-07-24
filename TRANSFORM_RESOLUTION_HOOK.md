# transformResolution Hook

The `transformResolution` hook allows you to modify package resolution objects during the dependency resolution process. This hook is called after a package is resolved but before the package ID and store path are generated.

## Hook Signature

```typescript
type TransformResolutionHook = (
  resolution: Resolution,
  context: TransformResolutionHookContext,
  logger: TransformResolutionHookLogger
) => Resolution | Promise<Resolution>

interface TransformResolutionHookContext {
  packageName: string
  version: string
  registry: string
  wantedDependency: WantedDependency
  lockfileDir: string
  projectDir: string
}

interface TransformResolutionHookLogger {
  info: (message: string) => void
  warn: (message: string) => void
}
```

## Usage

Add the hook to your `.pnpmfile.cjs`:

```javascript
module.exports = {
  hooks: {
    transformResolution: (resolution, context, logger) => {
      // Modify the resolution object
      return {
        ...resolution,
        tarball: modifyTarballUrl(resolution.tarball)
      }
    }
  }
}
```

## Use Cases

### 1. Localhost Port Normalization

Solve duplicate store directories when using local proxies with different ports:

```javascript
transformResolution: (resolution, context) => {
  if (resolution.tarball && resolution.tarball.includes('localhost:')) {
    return {
      ...resolution,
      tarball: resolution.tarball.replace(/localhost:\d+/, 'localhost')
    }
  }
  return resolution
}
```

### 2. CDN/Mirror Redirection

Redirect packages to faster CDNs or mirrors:

```javascript
transformResolution: (resolution, context) => {
  if (resolution.tarball?.includes('registry.npmjs.org')) {
    return {
      ...resolution,
      tarball: resolution.tarball.replace(
        'https://registry.npmjs.org',
        'https://cdn.jsdelivr.net/npm'
      )
    }
  }
  return resolution
}
```

### 3. Enterprise Security/Compliance

Route packages through security scanners:

```javascript
transformResolution: (resolution, context) => {
  if (!resolution.tarball?.includes('internal.company.com')) {
    return {
      ...resolution,
      tarball: `https://security-proxy.company.com/scan?url=${encodeURIComponent(resolution.tarball)}`
    }
  }
  return resolution
}
```

### 4. Development Overrides

Redirect specific packages to local development versions:

```javascript
transformResolution: (resolution, context) => {
  const devOverrides = {
    'my-company-lib': 'http://localhost:3000/my-company-lib.tgz',
    'shared-components': 'file:../shared-components/dist.tgz'
  }
  
  if (devOverrides[context.packageName]) {
    return {
      ...resolution,
      tarball: devOverrides[context.packageName]
    }
  }
  return resolution
}
```

### 5. Offline/Air-gapped Environments

Redirect all packages to local mirrors:

```javascript
transformResolution: (resolution, context) => {
  const localMirror = 'https://npm-mirror.internal.company.com'
  return {
    ...resolution,
    tarball: `${localMirror}/${context.packageName}/-/${context.packageName}-${context.version}.tgz`
  }
}
```

### 6. Geographic Optimization

Use regional mirrors based on location:

```javascript
transformResolution: (resolution, context) => {
  const region = process.env.AWS_REGION || 'us-east-1'
  const regionalMirrors = {
    'us-east-1': 'https://npm-us-east.company.com',
    'eu-west-1': 'https://npm-eu-west.company.com',
    'ap-southeast-1': 'https://npm-asia.company.com'
  }
  
  if (regionalMirrors[region]) {
    return {
      ...resolution,
      tarball: resolution.tarball.replace(
        'https://registry.npmjs.org',
        regionalMirrors[region]
      )
    }
  }
  return resolution
}
```

### 7. Integrity Hash Normalization

Handle packages served from different sources with different hashes:

```javascript
transformResolution: (resolution, context) => {
  const knownAlternativeHashes = {
    'lodash@4.17.21': {
      'https://cdn.jsdelivr.net': 'sha512-different-hash-here',
      'https://unpkg.com': 'sha512-another-hash-here'
    }
  }
  
  const packageKey = `${context.packageName}@${context.version}`
  const alternatives = knownAlternativeHashes[packageKey]
  
  if (alternatives) {
    for (const [urlPattern, hash] of Object.entries(alternatives)) {
      if (resolution.tarball?.includes(urlPattern)) {
        return {
          ...resolution,
          integrity: hash
        }
      }
    }
  }
  
  return resolution
}
```

## Important Notes

1. **Timing**: This hook is called during resolution, before the package ID and store path are generated
2. **Performance**: The hook is called for every resolved package, so keep transformations efficient
3. **Error Handling**: Ensure your hook handles errors gracefully to avoid breaking resolution
4. **Async Support**: The hook supports both synchronous and asynchronous transformations
5. **Validation**: The returned resolution object should be well-formed and valid

## Context Information

The `context` parameter provides access to:

- `packageName`: The name of the package being resolved
- `version`: The version of the package being resolved  
- `registry`: The registry URL used for resolution
- `wantedDependency`: The original dependency specification
- `lockfileDir`: Path to the directory containing the lockfile
- `projectDir`: Path to the project directory

## Logging

Use the provided logger for debugging and information:

```javascript
transformResolution: (resolution, context, logger) => {
  logger.info(`Transforming ${context.packageName}@${context.version}`)
  logger.warn('Using experimental transformation')
  return resolution
}
```

## Multiple Hooks

If multiple pnpmfiles define transformResolution hooks, they are executed in order:

```javascript
// First pnpmfile
transformResolution: (resolution, context) => {
  // First transformation
  return { ...resolution, tarball: transform1(resolution.tarball) }
}

// Second pnpmfile  
transformResolution: (resolution, context) => {
  // Second transformation (receives result of first)
  return { ...resolution, tarball: transform2(resolution.tarball) }
}
```
