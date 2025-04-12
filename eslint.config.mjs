// @ts-check

import eslint from "@eslint/js";
import { globalIgnores } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                project: ["./tsconfig.json", "./tsconfig.test.json"],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-member-access": "warn",
            "@typescript-eslint/no-unsafe-assignment": "warn",
            "@typescript-eslint/no-unsafe-call": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-floating-promises": "warn",
        },
    },
    prettierConfig,
    globalIgnores(["node_modules", "dist", "build", "coverage", "out"]),
);
