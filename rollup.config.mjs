import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import json from "rollup-plugin-json";
import replace from "rollup-plugin-replace";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const makeExternalPredicate = (externalArr) => {
  if (externalArr.length === 0) {
    return () => false;
  }
  const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`);
  return (id) => pattern.test(id);
};

const minify = process.env.MINIFY;
const format = process.env.FORMAT;
const es = format === "es";
const umd = format === "umd";
const cjs = format === "cjs";

let output;

if (es) {
  output = { file: `dist/final-form.es.js`, format: "es" };
} else if (umd) {
  if (minify) {
    output = {
      file: `dist/final-form.umd.min.js`,
      format: "umd",
    };
  } else {
    output = { file: `dist/final-form.umd.js`, format: "umd" };
  }
} else if (cjs) {
  output = { file: `dist/final-form.cjs.js`, format: "cjs" };
} else if (format) {
  throw new Error(`invalid format specified: "${format}".`);
} else {
  throw new Error("no format specified. --environment FORMAT:xxx");
}

export default {
  input: "src/index.ts",
  output: Object.assign(
    {
      name: "final-form",
      exports: "named",
      globals: { "final-form": "FinalForm" },
    },
    output,
  ),
  external: makeExternalPredicate(
    umd
      ? Object.keys(pkg.peerDependencies || {})
      : [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.peerDependencies || {}),
        ],
  ),
  plugins: [
    json(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: es,
      declarationDir: es ? "./dist" : undefined,
      noEmitOnError: true,
    }),
    commonjs({ include: "node_modules/**" }),
    babel({
      exclude: "node_modules/**",
      babelrc: false,
      babelHelpers: "runtime",
      extensions: [".ts", ".js"],
      presets: [
        [
          "@babel/preset-env",
          {
            modules: false,
            loose: true,
          },
        ],
      ],
      plugins: [
        ["@babel/plugin-transform-runtime", { useESModules: !cjs }],
        "@babel/plugin-syntax-dynamic-import",
        "@babel/plugin-syntax-import-meta",
      ],
    }),
    umd || es
      ? replace({
          "process.env.NODE_ENV": JSON.stringify(
            minify ? "production" : "development",
          ),
        })
      : null,
    minify ? terser() : null,
  ].filter(Boolean),
};
