import { defineConfig } from "tsup";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
    entry: ["src/extension.ts"],
    outDir: "out",
    format: ["cjs"],
    target: "es2022",
    sourcemap: true,
    minify: "terser",
    dts: false,
    clean: true,
    external: ["vscode"],
    onSuccess: async () => {
        console.log("Build successful!");
    },
});

/**
 * Recursively copy a directory
 */
function copyDir(src: string, dest: string): void {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    // Read source directory
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            // Recursively copy subdirectories
            copyDir(srcPath, destPath);
        } else {
            // Copy files
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
