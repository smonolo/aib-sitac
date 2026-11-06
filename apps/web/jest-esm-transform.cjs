const path = require('path')
const esbuild = require('esbuild')

module.exports = {
  process(_source, sourcePath) {
    const result = esbuild.buildSync({
      entryPoints: [sourcePath],
      bundle: true,
      write: false,
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      jsx: 'automatic',
      external: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
      ],
    })
    const code = result.outputFiles[0]?.text ?? ''
    return { code, map: { mappings: '' } }
  },
  getCacheKey(source, sourcePath, options) {
    return [
      sourcePath,
      options.configString,
      path.basename(__filename),
      process.version,
    ].join('::')
  },
}
