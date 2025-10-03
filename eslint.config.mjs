import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow 'any' types for Matrix SDK integration (external library typing issues)
      "@typescript-eslint/no-explicit-any": "off",
      // Allow missing dependencies in useEffect for Matrix client cleanup
      "react-hooks/exhaustive-deps": "warn",
    }
  }
];

export default eslintConfig;
