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
      // Disable TypeScript strict rules
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off",
      
      // Disable React strict rules
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off",
      
      // Keep only critical rules
      "no-console": "off",
      "no-debugger": "off",
      "prefer-const": "off",
      "no-var": "off",
    }
  }
];

export default eslintConfig;
