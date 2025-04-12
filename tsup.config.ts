import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/extension.ts"],
    outDir: "out",
    format: ["cjs"],
    target: "es2022",
    sourcemap: process.env.NODE_ENV !== "production",
    minify: "terser",
    dts: false,
    clean: true,
    external: ["vscode"],
    onSuccess: async () => {
        console.log("Build successful!");
    },
});
