import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'
import flow from 'rollup-plugin-flow'
import commonjs from 'rollup-plugin-commonjs'
import compiler from '@ampproject/rollup-plugin-closure-compiler'
import replace from 'rollup-plugin-replace'
import pkg from './package.json'
import { terser } from 'rollup-plugin-terser'

const makeExternalPredicate = externalArr => {
  if (externalArr.length === 0) {
    return () => false
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
  return id => pattern.test(id)
}

const minify = process.env.MINIFY
const format = process.env.FORMAT
const es = format === 'es'
const umd = format === 'umd'
const cjs = format === 'cjs'

let output

if (es) {
  output = { file: `dist/final-form.es.js`, format: 'es' }
} else if (umd) {
  if (minify) {
    output = {
      file: `dist/final-form.umd.min.js`,
      format: 'umd'
    }
  } else {
    output = { file: `dist/final-form.umd.js`, format: 'umd' }
  }
} else if (cjs) {
  output = { file: `dist/final-form.cjs.js`, format: 'cjs' }
} else if (format) {
  throw new Error(`invalid format specified: "${format}".`)
} else {
  throw new Error('no format specified. --environment FORMAT:xxx')
}

export default {
  input: 'src/index.js',
  output: Object.assign(
    {
      name: 'final-form',
      exports: 'named'
    },
    output
  ),
  external: makeExternalPredicate(
    umd
      ? Object.keys(pkg.peerDependencies || {})
      : [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.peerDependencies || {})
        ]
  ),
  plugins: [
    resolve({ jsnext: true, main: true }),
    json(),
    flow(),
    commonjs({ include: 'node_modules/**' }),
    babel({
      exclude: 'node_modules/**',
      babelrc: false,
      runtimeHelpers: true,
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            loose: true
          }
        ],
        '@babel/preset-flow'
      ],
      plugins: [
        ['@babel/plugin-transform-runtime', { useESModules: !cjs }],
        '@babel/plugin-transform-flow-strip-types'
      ]
    }),
    umd || es
      ? replace({
          'process.env.NODE_ENV': JSON.stringify(
            minify ? 'production' : 'development'
          )
        })
      : null,
    umd && minify
      ? compiler({
          compilation_level: 'SIMPLE_OPTIMIZATIONS'
        })
      : null,
    minify ? terser() : null
  ].filter(Boolean)
}
