module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === 'jest-runner') {
        pkg.peerDependencies = pkg.peerDependencies || {}
        pkg.peerDependencies['jest-environment-jsdom'] = '*'
      }
      return pkg
    }
  }
}
