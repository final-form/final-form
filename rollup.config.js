import typescript from "rollup-plugin-typescript2";
import babel from "rollup-plugin-babel";
import json from "rollup-plugin-json";
import flow from "rollup-plugin-flow";
import commonjs from "rollup-plugin-commonjs";
import { uglify } from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";
import pkg from "./package.json";

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
    typescript({
      outputToFilesystem: true,
      tsconfig: "./tsconfig.json",
    }),
    json(),
    commonjs({ include: "node_modules/**" }),
    umd || es
      ? replace({
          "process.env.NODE_ENV": JSON.stringify(
            minify ? "production" : "development",
          ),
        })
      : null,
    minify ? uglify() : null,
  ].filter(Boolean),
};
