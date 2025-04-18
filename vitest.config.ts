import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        passWithNoTests: true,
        globals: true,
        environment: "node",
        include: ["test/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/**/*.ts"],
            exclude: ["**/*.d.ts"],
        },
        setupFiles: ["./test/setup.ts"],
        server: {
            deps: {
                external: ["vscode"],
                inline: ["node-fetch"],
            },
        },
        mockReset: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
