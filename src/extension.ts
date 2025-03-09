import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

interface TokenData {
    file: string;
    language: string;
    lines: Array<{
        lineNumber: number;
        text: string;
        tokens: Array<{
            scope: string;
        }>;
    }>;
}

export function activate(context: vscode.ExtensionContext) {
    const extensionName = "vscode-better-netlinx";
    console.log(`Extension "${extensionName}" is now active!`);

    // Add this near the beginning of the activate function
    setupCustomTokenColoring(context);

    try {
        // Show a notification that the extension is active
        vscode.window.showInformationMessage(
            `${extensionName} activated! NetLinx syntax highlighting enabled.`
        );

        // Get the path to the syntax file
        const extensionPath = context.extensionPath;
        const syntaxFilePath = path.join(
            extensionPath,
            "syntaxes",
            "netlinx.tmLanguage.json"
        );

        console.log(`Watching syntax file: ${syntaxFilePath}`);

        // Create a file system watcher using VS Code API - more reliable than fs.watch
        try {
            // Use VS Code's file watcher which is more reliable across platforms
            const fileWatcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(
                    extensionPath,
                    "**/syntaxes/**/*.json"
                )
            );

            // When any JSON file in the syntaxes folder changes
            fileWatcher.onDidChange((uri) => {
                console.log(`Change detected in file: ${uri.fsPath}`);

                // Show notification
                const statusBarItem = vscode.window.createStatusBarItem(
                    vscode.StatusBarAlignment.Right
                );
                statusBarItem.text =
                    "$(sync~spin) NetLinx syntax changed. Reloading...";
                statusBarItem.show();

                // Automatically reload after a brief delay
                // This delay allows VS Code to finish writing the file
                setTimeout(() => {
                    console.log("Auto-reloading due to syntax file change");
                    reloadExtensionHost();
                    statusBarItem.dispose();
                }, 1500);
            });

            // Add watcher to context for proper disposal
            context.subscriptions.push(fileWatcher);
            console.log(
                "File watcher registered successfully using VS Code API"
            );
        } catch (e) {
            console.error("Error setting up VS Code file watcher:", e);

            // Fallback to fs.watch if VS Code watcher fails
            try {
                if (fs.existsSync(syntaxFilePath)) {
                    console.log("Falling back to Node.js fs.watch API");
                    const watcher = fs.watch(syntaxFilePath, (eventType) => {
                        if (eventType === "change") {
                            console.log(
                                `Change detected in syntax file using fs.watch: ${syntaxFilePath}`
                            );

                            // Show notification and auto-reload
                            const statusBarItem =
                                vscode.window.createStatusBarItem(
                                    vscode.StatusBarAlignment.Right
                                );
                            statusBarItem.text =
                                "$(sync~spin) NetLinx syntax changed. Reloading...";
                            statusBarItem.show();

                            // Add a delay before reloading to ensure file write is complete
                            setTimeout(() => {
                                console.log(
                                    "Auto-reloading due to syntax file change (fs.watch)"
                                );
                                reloadExtensionHost();
                                statusBarItem.dispose();
                            }, 1500);
                        }
                    });

                    // Register for disposal
                    context.subscriptions.push({
                        dispose: () => {
                            try {
                                watcher.close();
                            } catch (e) {
                                console.error("Error closing file watcher:", e);
                            }
                        },
                    });
                    console.log(
                        "Fallback file watcher registered successfully"
                    );
                } else {
                    console.error(`Syntax file not found: ${syntaxFilePath}`);
                }
            } catch (e) {
                console.error("Error setting up fallback file watcher:", e);
            }
        }

        // Register a command to manually reload the extension
        const reloadCommand = vscode.commands.registerCommand(
            "netlinx.reloadSyntax",
            () => {
                try {
                    console.log("Manual reload triggered");
                    vscode.window.showInformationMessage(
                        "Reloading NetLinx extension..."
                    );

                    // Use safer reload approach
                    setTimeout(() => {
                        reloadExtensionHost();
                    }, 500);
                } catch (e) {
                    console.error("Error during manual reload:", e);
                }
            }
        );

        // Add command to subscriptions
        context.subscriptions.push(reloadCommand);

        // Register a command to enable the token inspector
        const inspectTokensCommand = vscode.commands.registerCommand(
            "netlinx.inspectTokens",
            () => {
                vscode.commands.executeCommand("editor.action.inspectTMScopes");
            }
        );

        // Add command to subscriptions
        context.subscriptions.push(inspectTokensCommand);

        // Helper function to save token data
        async function saveTokenData(
            document: vscode.TextDocument
        ): Promise<string | undefined> {
            try {
                if (!document) {
                    console.log("No active document to analyze tokens");
                    return undefined;
                }

                // Structure to hold token data
                const tokenData: TokenData = {
                    file: document.fileName,
                    language: document.languageId,
                    lines: [],
                };

                // Process each line in the document
                for (let i = 0; i < document.lineCount; i++) {
                    const line = document.lineAt(i).text;

                    // Create a line entry
                    const lineData = {
                        lineNumber: i,
                        text: line,
                        tokens: [] as Array<{ scope: string }>,
                    };

                    // This is a simplified tokenization - in a real scenario,
                    // we would use VS Code's tokenization API more extensively
                    const tokenChars = line.split(/([^\w])/);
                    let charPos = 0;

                    for (const token of tokenChars) {
                        if (token.trim().length > 0) {
                            lineData.tokens.push({
                                scope: "variable.other.netlinx", // Default scope
                            });
                        }
                        charPos += token.length;
                    }

                    tokenData.lines.push(lineData);
                }

                // Save token data to file
                const fileName = path.join(
                    context.extensionPath,
                    "token-analysis.json"
                );
                fs.writeFileSync(fileName, JSON.stringify(tokenData, null, 2));
                console.log(`Token analysis exported to: ${fileName}`);

                return fileName;
            } catch (err) {
                console.error(`Failed to save token data: ${err}`);
                return undefined;
            }
        }

        // Register a better command to export token information
        const exportTokensCommand = vscode.commands.registerCommand(
            "netlinx.exportTokens",
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage("No active editor found");
                    return;
                }

                const document = editor.document;

                try {
                    // Use an extension command not in the public API but often works
                    // This is using internal VS Code functionality which might change
                    const tokenColors = await vscode.commands.executeCommand(
                        "vscode.executeDocumentHighlights",
                        document.uri,
                        new vscode.Position(0, 0)
                    );

                    // Create a WebView panel to display a live token map
                    const panel = vscode.window.createWebviewPanel(
                        "tokenAnalyzer",
                        `Token Analysis: ${path.basename(document.fileName)}`,
                        vscode.ViewColumn.Beside,
                        { enableScripts: true }
                    );

                    // Status bar message
                    vscode.window.setStatusBarMessage(
                        "Analyzing tokens...",
                        3000
                    );

                    // Set up message handling between extension and webview
                    panel.webview.onDidReceiveMessage(async (message) => {
                        if (message.command === "saveTokenData") {
                            try {
                                const fileName = path.join(
                                    context.extensionPath,
                                    "token-analysis.json"
                                );
                                fs.writeFileSync(
                                    fileName,
                                    JSON.stringify(message.data, null, 2)
                                );
                                vscode.window.showInformationMessage(
                                    `Token data saved to: ${fileName}`
                                );

                                // No longer asking about opening the file
                            } catch (err) {
                                vscode.window.showErrorMessage(
                                    `Failed to save token data: ${err}`
                                );
                            }
                        }
                    });

                    // Build HTML content for the webview
                    const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Token Analyzer</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 10px; }
                            pre { background-color: #f3f3f3; padding: 10px; border-radius: 3px; overflow: auto; }
                            .token { display: inline-block; position: relative; cursor: pointer; }
                            .token:hover { background-color: rgba(100,100,100,0.1); border-radius: 2px; }
                            .token-info { position: fixed; background: #fff; border: 1px solid #ccc; padding: 10px;
                                       box-shadow: 0 2px 8px rgba(0,0,0,0.2); border-radius: 4px; display: none; z-index: 1000; }
                            button { margin-bottom: 15px; padding: 8px 16px; background: #007acc; color: white;
                                   border: none; border-radius: 4px; cursor: pointer; }
                            button:hover { background: #0069b3; }
                            .stats { margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 4px; }
                            .scope-list { margin-top: 10px; }
                            .scope-item { display: inline-block; margin-right: 10px; margin-bottom: 5px; padding: 3px 8px;
                                       background: #eee; border-radius: 12px; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <h1>Token Analysis: ${document.fileName}</h1>
                        <p>Interactive token analysis for NetLinx code. Hover over tokens to see their scope information.</p>

                        <button id="extractBtn">Extract and Save Token Data</button>

                        <div id="fileContent"></div>

                        <div class="stats">
                            <h2>Token Statistics</h2>
                            <div id="tokenStats">Analyzing...</div>

                            <h3>Scope List</h3>
                            <div id="scopeList" class="scope-list"></div>
                        </div>

                        <div id="tokenInfo" class="token-info"></div>

                        <script>
                            // ... existing code ...
                        </script>
                    </body>
                    </html>
                    `;

                    panel.webview.html = htmlContent;
                } catch (err) {
                    console.error("Error analyzing tokens:", err);
                    vscode.window.showErrorMessage(
                        `Failed to analyze tokens: ${err}`
                    );
                }
            }
        );

        context.subscriptions.push(exportTokensCommand);

        // Automatically export token analysis in development mode
        if (
            process.env.VSCODE_DEBUG_MODE === "true" ||
            (typeof vscode.env.sessionId === "string" &&
                vscode.env.sessionId.includes("debug")) ||
            context.extensionMode === vscode.ExtensionMode.Development
        ) {
            console.log(
                "Development mode detected, auto-exporting token analysis"
            );

            // Wait a bit for any editors to be fully initialized
            setTimeout(async () => {
                try {
                    const editor = vscode.window.activeTextEditor;

                    if (editor) {
                        console.log(
                            "Automatically exporting token analysis for active editor"
                        );
                        const fileName = await saveTokenData(editor.document);
                        if (fileName) {
                            vscode.window.setStatusBarMessage(
                                `Token analysis exported to: ${fileName}`,
                                5000
                            );
                        }
                    } else {
                        // Try to find a NetLinx file and open it
                        const netLinxFiles = await vscode.workspace.findFiles(
                            "**/*.{axs,axi}",
                            null,
                            1
                        );

                        if (netLinxFiles.length > 0) {
                            console.log(
                                `Found NetLinx file: ${netLinxFiles[0].fsPath}`
                            );
                            const document =
                                await vscode.workspace.openTextDocument(
                                    netLinxFiles[0]
                                );
                            const fileName = await saveTokenData(document);
                            if (fileName) {
                                vscode.window.setStatusBarMessage(
                                    `Token analysis exported to: ${fileName}`,
                                    5000
                                );
                            }
                        } else {
                            console.log(
                                "No NetLinx files found in workspace for auto token analysis"
                            );
                        }
                    }
                } catch (e) {
                    console.error("Error in auto token analysis:", e);
                }
            }, 2000);
        }
    } catch (e) {
        console.error("Error during extension activation:", e);
    }
}

/**
 * Sets up custom token coloring for NetLinx sections if enabled
 */
async function setupCustomTokenColoring(context: vscode.ExtensionContext) {
    // Check if user has enabled the feature
    const config = vscode.workspace.getConfiguration("netlinx");
    const enhanceTheme = config.get("enhanceThemeColors", false);

    if (!enhanceTheme) {
        // Register command to enable theme enhancements
        const enableCommand = vscode.commands.registerCommand(
            "netlinx.enableThemeEnhancements",
            async () => {
                await applyTokenColorCustomizations(true);
                await vscode.workspace
                    .getConfiguration("netlinx")
                    .update(
                        "enhanceThemeColors",
                        true,
                        vscode.ConfigurationTarget.Global
                    );
                vscode.window.showInformationMessage(
                    "NetLinx theme enhancements enabled. You may need to reload the window."
                );
            }
        );

        context.subscriptions.push(enableCommand);
        return;
    }

    // Apply customizations
    applyTokenColorCustomizations(true);

    // Register command to disable theme enhancements
    const disableCommand = vscode.commands.registerCommand(
        "netlinx.disableThemeEnhancements",
        async () => {
            await applyTokenColorCustomizations(false);
            await vscode.workspace
                .getConfiguration("netlinx")
                .update(
                    "enhanceThemeColors",
                    false,
                    vscode.ConfigurationTarget.Global
                );
            vscode.window.showInformationMessage(
                "NetLinx theme enhancements disabled. You may need to reload the window."
            );
        }
    );

    context.subscriptions.push(disableCommand);
}

/**
 * Applies or removes token color customizations
 */
async function applyTokenColorCustomizations(apply: boolean) {
    const workbenchConfig = vscode.workspace.getConfiguration("editor");
    const tokenColorCustomizations =
        workbenchConfig.get("tokenColorCustomizations") || {};

    // Create a deep copy to avoid modifying the object reference
    const updatedCustomizations = JSON.parse(
        JSON.stringify(tokenColorCustomizations)
    );

    if (apply) {
        // Define settings with NetLinx-specific scope
        if (!updatedCustomizations["[NetLinx]"]) {
            updatedCustomizations["[NetLinx]"] = {};
        }

        if (!updatedCustomizations["[NetLinx]"].textMateRules) {
            updatedCustomizations["[NetLinx]"].textMateRules = [];
        }

        // Add section highlighting colors
        updatedCustomizations["[NetLinx]"].textMateRules = [
            {
                scope: "entity.name.section.netlinx",
                settings: {
                    foreground: "#ff9d00",
                    fontStyle: "bold",
                },
            },
            {
                scope: "entity.name.section.program.netlinx",
                settings: {
                    foreground: "#ff9d00",
                    fontStyle: "bold",
                },
            },
            {
                scope: "entity.name.section.module.netlinx",
                settings: {
                    foreground: "#ff9d00",
                    fontStyle: "bold",
                },
            },
            {
                scope: "keyword.declaration.function.netlinx",
                settings: {
                    foreground: "#569cd6",
                    fontStyle: "bold",
                },
            },
            {
                scope: "keyword.declaration.module.netlinx",
                settings: {
                    foreground: "#569cd6",
                    fontStyle: "bold",
                },
            },
            ...updatedCustomizations["[NetLinx]"].textMateRules,
        ];
    } else {
        // Remove our customizations if they exist
        if (
            updatedCustomizations["[NetLinx]"] &&
            updatedCustomizations["[NetLinx]"].textMateRules
        ) {
            updatedCustomizations["[NetLinx]"].textMateRules =
                updatedCustomizations["[NetLinx]"].textMateRules.filter(
                    (rule: any) => {
                        return (
                            !rule.scope ||
                            !(
                                rule.scope.includes("section.netlinx") ||
                                rule.scope.includes(
                                    "declaration.function.netlinx"
                                ) ||
                                rule.scope.includes(
                                    "declaration.module.netlinx"
                                )
                            )
                        );
                    }
                );

            // Clean up if empty
            if (updatedCustomizations["[NetLinx]"].textMateRules.length === 0) {
                delete updatedCustomizations["[NetLinx]"].textMateRules;
            }

            if (Object.keys(updatedCustomizations["[NetLinx]"]).length === 0) {
                delete updatedCustomizations["[NetLinx]"];
            }
        }
    }

    // Update the configuration
    await workbenchConfig.update(
        "tokenColorCustomizations",
        updatedCustomizations,
        vscode.ConfigurationTarget.Global
    );
}

// Function to reload the extension host
function reloadExtensionHost() {
    try {
        console.log("Reloading VS Code window");
        vscode.commands.executeCommand("workbench.action.reloadWindow");
    } catch (e) {
        console.error("Error reloading window:", e);
        // Fallback message in case the reload fails
        vscode.window.showErrorMessage(
            "Failed to reload window. Please reload manually."
        );
    }
}

// This method is called when the extension is deactivated
export function deactivate() {
    console.log('Extension "vscode-better-netlinx" is now deactivated!');
}
