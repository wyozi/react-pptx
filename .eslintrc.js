module.exports = {
  parser: "@typescript-eslint/parser",
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "prettier/prettier": "error",
    "no-console": "error",
    "no-constant-condition": "off",
    "no-unreachable": "error",
    "spaced-comment": "error",
    "@typescript-eslint/ban-types": "error",
    "@typescript-eslint/no-empty-function": [
      "error",
      { allow: ["arrowFunctions"] },
    ],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { ignoreRestSiblings: true, argsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/restrict-plus-operands": "error",
    "@typescript-eslint/no-explicit-any": "off",
  },
};
