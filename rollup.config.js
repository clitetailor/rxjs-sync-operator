import babel from 'rollup-plugin-babel'
import pkg from './package.json'

export default {
  input: 'index.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs'
    },
    {
      name: 'rxjs-overlap-map',
      globals: {
        rxjs: 'rxjs',
        'rxjs/operators': 'rxjs.operators'
      },
      file: pkg.main.split('.')[0] + '.umd.js',
      format: 'umd'
    }
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {})
  ],
  plugins: [
    babel({
      babelrc: true,
      comments: true,
      runtimeHelpers: true
    })
  ]
}
