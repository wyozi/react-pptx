import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
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
        file: "preview/index.js",
      },
    ],
    external,
    plugins,
  },
  {
    input: "src/layout/Flex.tsx",
    output: [
      {
        format: "cjs",
        file: "flex/index.js",
      },
    ],
    external,
    plugins,
  },
];
