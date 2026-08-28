import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["build/**", ".react-router/**", "node_modules/**", "coverage/**"],
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // Enforced as errors — catch real correctness bugs.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",
      // Relaxed to warnings — pervasive legacy usage; tighten incrementally.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      // Intentional in React Router route signatures (meta/loader/action with no args).
      "no-empty-pattern": "off",
    },
  },
);
