import * as vscode from "vscode";
import fs from "node:fs";
import path from "node:path";

export interface TokenData {
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

/**
 * Helper function to save token data
 */
export async function saveTokenData(
    document: vscode.TextDocument,
    extensionPath: string
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
        const fileName = path.join(extensionPath, "token-analysis.json");
        fs.writeFileSync(fileName, JSON.stringify(tokenData, null, 2));
        console.log(`Token analysis exported to: ${fileName}`);

        return fileName;
    } catch (err) {
        console.error(`Failed to save token data: ${err}`);
        return undefined;
    }
}

/**
 * Register commands for token analysis functionality
 */
export function registerTokenAnalyzerCommands(
    context: vscode.ExtensionContext
): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

    // Register a command to enable the token inspector
    const inspectTokensCommand = vscode.commands.registerCommand(
        "netlinx.inspectTokens",
        () => {
            vscode.commands.executeCommand("editor.action.inspectTMScopes");
        }
    );
    disposables.push(inspectTokensCommand);

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
                vscode.window.setStatusBarMessage("Analyzing tokens...", 3000);

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
    disposables.push(exportTokensCommand);

    return disposables;
}

/**
 * Run automatic token analysis in development mode
 */
export async function runAutoTokenAnalysis(
    context: vscode.ExtensionContext
): Promise<void> {
    if (
        process.env.VSCODE_DEBUG_MODE === "true" ||
        (typeof vscode.env.sessionId === "string" &&
            vscode.env.sessionId.includes("debug")) ||
        context.extensionMode === vscode.ExtensionMode.Development
    ) {
        console.log("Development mode detected, auto-exporting token analysis");

        // Wait a bit for any editors to be fully initialized
        setTimeout(async () => {
            try {
                const editor = vscode.window.activeTextEditor;

                if (editor) {
                    console.log(
                        "Automatically exporting token analysis for active editor"
                    );
                    const fileName = await saveTokenData(
                        editor.document,
                        context.extensionPath
                    );
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
                        const fileName = await saveTokenData(
                            document,
                            context.extensionPath
                        );
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
}
