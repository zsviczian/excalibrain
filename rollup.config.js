import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { env } from "process";
import babel from '@rollup/plugin-babel';
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";

const isProd = (process.env.NODE_ENV === "production");
console.log("Is production", isProd);
const DIST_FOLDER = 'dist';

export default {
  input: 'src/excalibrain-main.ts',
  output: {
    dir: DIST_FOLDER,
    entryFileNames: 'main.js',
    sourcemap: isProd?false:'inline',
    format: 'cjs',
    exports: 'default',
  },
  external: ['obsidian'],
  plugins: [
    replace({
      preventAssignment: true,
      "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV),
    }),
    babel({
      exclude: "node_modules/**"
    }),
    commonjs(),
    nodeResolve({ browser: true, preferBuiltins: false }),
    typescript({inlineSources: !isProd}),
    ...isProd ? [
      terser({toplevel: true, compress: {passes: 2}})
    ] : [],
    copy({
      targets: [
        { src: 'manifest.json', dest: DIST_FOLDER },
        { src: 'styles.css', dest: DIST_FOLDER },
      ],
      verbose: true, // Optional: To display copied files in the console
    }),
  ],
};