const webpack = require("webpack");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const path = require("path");

let latestTag = require("child_process")
  .execSync("git describe --tags --abbrev=0")
  .toString();

let commitHash = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString();

module.exports = {
  entry: "./index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ttf$/,
        use: ["file-loader"],
      },
      {
        test: /\.d\.ts$/i,
        use: 'raw-loader',
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __LATEST_GIT_TAG__: JSON.stringify(latestTag),
      __LATEST_GIT_COMMIT_HASH__: JSON.stringify(commitHash)
    }),
    new MonacoWebpackPlugin({
      languages: ["typescript"],
    }),
  ],
  resolve: {
    alias: {
      react: path.resolve("./node_modules/react"),
    },
  },
};
