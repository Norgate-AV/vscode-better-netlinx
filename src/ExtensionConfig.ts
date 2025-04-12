import * as vscode from "vscode";
import fs from "node:fs";
import path from "node:path";

/**
 * Interface for language configuration
 */
export interface LanguageConfiguration {
    /**
     * Language identifier
     */
    id: string;

    /**
     * File extensions for this language (without the dot)
     */
    extensions: string[];

    /**
     * Display name for the language
     */
    displayName: string;
}

interface PackageJson {
    id: string;
    contributes?: {
        languages?: Array<{
            id: string;
            extensions?: string[];
            aliases?: string[];
        }>;
    };
}

/**
 * Get language configuration from package.json
 */
export function getLanguageConfiguration(
    context: vscode.ExtensionContext,
): LanguageConfiguration {
    try {
        const packageJsonPath = path.join(
            context.extensionPath,
            "package.json",
        );
        const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf-8"),
        ) as PackageJson;

        // Find the NetLinx language definition
        const languages = packageJson.contributes?.languages || [];
        const netlinxLanguage = languages.find((lang) => lang.id === "netlinx");

        if (!netlinxLanguage) {
            console.error(
                "Could not find NetLinx language definition in package.json",
            );
            return {
                id: "netlinx",
                extensions: ["axs", "axi"],
                displayName: "NetLinx",
            };
        }

        return {
            id: netlinxLanguage.id,
            extensions: (netlinxLanguage.extensions ?? []).map((ext: string) =>
                ext.replace(".", ""),
            ),
            displayName: netlinxLanguage.aliases?.[0] || "NetLinx",
        };
    } catch (error) {
        console.error("Error loading language configuration:", error);

        // Fallback to default values
        return {
            id: "netlinx",
            extensions: ["axs", "axi"],
            displayName: "NetLinx",
        };
    }
}

/**
 * Creates a glob pattern from language extensions
 */
export function createFileExtensionGlob(extensions: string[]): string {
    return `**/*.{${extensions.join(",")}}`;
}
