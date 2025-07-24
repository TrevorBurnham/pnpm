// Test file for transformResolution hook
// This demonstrates the localhost port normalization use case

module.exports = {
  hooks: {
    transformResolution: (resolution, context) => {
      console.log('transformResolution called with:', {
        packageName: context.packageName,
        version: context.version,
        registry: context.registry,
        originalTarball: resolution.tarball
      })

      // Normalize localhost URLs to ignore port variations
      if (resolution.tarball && resolution.tarball.includes('localhost:')) {
        const normalizedTarball = resolution.tarball.replace(/localhost:\d+/, 'localhost')
        console.log('Normalized tarball:', normalizedTarball)
        
        return {
          ...resolution,
          tarball: normalizedTarball
        }
      }
      
      return resolution
    }
  }
}
