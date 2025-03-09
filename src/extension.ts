import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
    const extensionName = "vscode-better-netlinx";
    console.log(`Extension "${extensionName}" is now active!`);

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
    } catch (e) {
        console.error("Error during extension activation:", e);
    }
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
