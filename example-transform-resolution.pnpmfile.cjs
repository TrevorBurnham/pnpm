// Example .pnpmfile.cjs demonstrating the transformResolution hook
// This solves the localhost proxy port duplication issue

module.exports = {
  hooks: {
    transformResolution: (resolution, context) => {
      // Log what we're transforming (optional)
      console.log(`Transforming resolution for ${context.packageName}@${context.version}`)
      
      // SOLUTION 1: Localhost Port Normalization
      // Normalize localhost URLs to ignore port variations
      // This prevents duplicate store directories for localhost:7769, localhost:8080, etc.
      if (resolution.tarball && resolution.tarball.includes('localhost:')) {
        const originalTarball = resolution.tarball
        const normalizedTarball = resolution.tarball.replace(/localhost:\d+/, 'localhost')
        
        console.log(`Normalized ${originalTarball} -> ${normalizedTarball}`)
        
        return {
          ...resolution,
          tarball: normalizedTarball
        }
      }
      
      // SOLUTION 2: CDN Redirection
      // Redirect all npmjs.org packages to a faster CDN
      if (resolution.tarball?.includes('registry.npmjs.org')) {
        return {
          ...resolution,
          tarball: resolution.tarball.replace(
            'https://registry.npmjs.org',
            'https://cdn.jsdelivr.net/npm'
          )
        }
      }
      
      // SOLUTION 3: Enterprise Security Proxy
      // Route external packages through security scanner
      if (!resolution.tarball?.includes('internal.company.com')) {
        return {
          ...resolution,
          tarball: `https://security-proxy.company.com/scan?url=${encodeURIComponent(resolution.tarball)}`
        }
      }
      
      // SOLUTION 4: Development Overrides
      // Redirect specific packages to local development versions
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
      
      // SOLUTION 5: Offline/Air-gapped Environments
      // Redirect all packages to local mirror
      if (process.env.PNPM_OFFLINE_MIRROR) {
        const localMirror = process.env.PNPM_OFFLINE_MIRROR
        return {
          ...resolution,
          tarball: `${localMirror}/${context.packageName}/-/${context.packageName}-${context.version}.tgz`
        }
      }
      
      // Return unchanged resolution if no transformations apply
      return resolution
    }
  }
}
