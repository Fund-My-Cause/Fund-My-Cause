import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pascalCaseComponentFiles = require("./eslint-rules/pascal-case-component-files.js");
const noMixedNullUndefined = require("./eslint-rules/no-mixed-null-undefined.js");

const dummyPlugin = (ruleNames) => ({
  rules: Object.fromEntries(
    ruleNames.map((name) => [name, { create: () => ({}) }]),
  ),
});

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/coverage/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    files: ["apps/interface/**/*.{ts,tsx}"],
    plugins: {
      "@next/next": dummyPlugin(["no-img-element", "no-html-link-for-pages"]),
      "jsx-a11y": dummyPlugin(["media-has-caption"]),
      "local-rules": {
        rules: {
          "pascal-case-component-files": pascalCaseComponentFiles,
        },
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/exhaustive-deps": "off",
      "local-rules/pascal-case-component-files": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@fund-my-cause/components/src/*"],
              message:
                "Do not import from @fund-my-cause/components internals. Use the package root or a declared subpath export instead.",
            },
            {
              group: [
                "@fund-my-cause/components/*.tsx",
                "@fund-my-cause/components/*.ts",
              ],
              message:
                "Do not import source files directly from @fund-my-cause/components. Use the package root or a declared subpath export instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/types/**/*.ts"],
    plugins: {
      "local-rules": {
        rules: {
          "no-mixed-null-undefined": noMixedNullUndefined,
        },
      },
    },
    rules: {
      "local-rules/no-mixed-null-undefined": "error",
    },
  },
  {
    files: ["apps/interface/src/**/*.{ts,tsx}"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
    },
  },
  {
    files: [
      "apps/interface/**/*.test.{ts,tsx}",
      "apps/interface/**/*.spec.{ts,tsx}",
      "apps/interface/**/__tests__/**/*.{ts,tsx}",
      "apps/interface/**/__mocks__/**/*.{ts,tsx}",
      "apps/interface/jest.setup.ts",
      "apps/interface/jest.polyfills.ts",
      "apps/interface/vitest.setup.ts",
      "apps/interface/scripts/**/*.{ts,tsx}",
      "apps/interface/src/lib/analytics/run-job.ts",
    ],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["apps/interface/src/lib/graphql/generated.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["apps/components-lib/**/*.{ts,tsx}"],
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      "no-undef": "off",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: [
      "apps/components-lib/**/*.test.{ts,tsx}",
      "apps/components-lib/**/*.spec.{ts,tsx}",
      "apps/components-lib/**/__tests__/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];
