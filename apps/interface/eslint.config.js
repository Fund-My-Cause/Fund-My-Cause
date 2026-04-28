import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // These rules crash with ESLint 9 due to removed context.getScope /
      // context.getAncestors APIs in the bundled plugin versions.
      "react-hooks/rules-of-hooks": "off",
      "@next/next/no-duplicate-head": "off",
    },
  },
];

export default eslintConfig;

