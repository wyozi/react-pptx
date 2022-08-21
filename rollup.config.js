import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import virtual from '@rollup/plugin-virtual';
import pkg from "./package.json";

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
];
const plugins = [
  nodeResolve(),
  commonjs(),
  typescript({
    typescript: require("typescript"),
    exclude: "**/*.spec.tsx",
  }),
];

export default [
  {
    input: "src/index.tsx",
    output: [
      {
        file: pkg.main,
        format: "cjs",
      },
      {
        file: pkg.module,
        format: "es",
      },
    ],
    external,
    plugins,
  },
  {
    input: "src/preview/Preview.tsx",
    output: [
      {
        format: "cjs",
        file: "dist/preview/Preview.js"
      },
    ],
    external,
    plugins
  },
  {
    input: 'previewEntry.ts',
    output: [
      {
        format: "cjs",
        file: "preview/index.js"
      },
    ],
    plugins: [
      {
        name: 'keep-relative-preview-dist-import',
        resolveId(source) {
          if (source === './dist/preview/Preview') {
            return { id: '../dist/preview/Preview', external: true };
          }
          return null;
        }
      },
      virtual({
        'previewEntry.ts': `export * from './dist/preview/Preview'`
      })
    ]
  }
];
