import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import virtual from "@rollup/plugin-virtual";
import pkg from "./package.json" assert { type: "json" };

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
];
const plugins = [
  nodeResolve(),
  commonjs(),
  typescript({
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
        file: "dist/preview/Preview.js",
      },
    ],
    external,
    plugins,
  },
  {
    input: "previewEntry.ts",
    output: [
      {
        format: "cjs",
        file: "preview/index.js",
      },
    ],
    plugins: [
      {
        name: "keep-relative-preview-dist-import",
        resolveId(source) {
          if (source === "./dist/preview/Preview") {
            return { id: "../dist/preview/Preview", external: true };
          }
          return null;
        },
      },
      virtual({
        "previewEntry.ts": `export { default } from './dist/preview/Preview'`,
      }),
    ],
  },
];
