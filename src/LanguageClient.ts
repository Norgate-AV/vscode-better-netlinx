import * as vscode from "vscode";
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from "vscode-languageclient/node";
import os from "node:os";
import {
    createFileExtensionGlob,
    getLanguageConfiguration,
} from "./ExtensionConfig";

let client: LanguageClient | undefined;

/**
 * Start the NetLinx language server
 */
export async function startLanguageServer(
    context: vscode.ExtensionContext
): Promise<void> {
    // Check if language server is enabled in settings
    const config = vscode.workspace.getConfiguration("netlinx");
    const isEnabled = config.get<boolean>("languageServer.enabled", true);

    if (!isEnabled) {
        console.log("NetLinx language server is disabled in settings");
        return;
    }

    // Get language configuration from package.json
    const langConfig = getLanguageConfiguration(context);

    // Get server path from settings
    let serverPath = config.get<string>("languageServer.path", "");
    const serverArgs = config.get<string[]>("languageServer.args", []);

    // If path not specified in settings, use default based on platform
    if (!serverPath) {
        const platform = os.platform();
        serverPath =
            platform === "win32"
                ? "netlinx-language-server.exe"
                : "netlinx-language-server";
        console.log(
            `No server path specified in settings, using default: ${serverPath}`
        );
    } else {
        console.log(`Using language server path from settings: ${serverPath}`);
    }

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for NetLinx documents
        documentSelector: [{ scheme: "file", language: langConfig.id }],
        synchronize: {
            // Notify the server about file changes in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher(
                createFileExtensionGlob(langConfig.extensions)
            ),
        },
    };

    // Options to control the server process
    const serverOptions: ServerOptions = {
        command: serverPath,
        args: serverArgs,
        options: {
            shell: false,
        },
    };

    // Create and start the language client
    client = new LanguageClient(
        "netlinx-language-server",
        "NetLinx Language Server",
        serverOptions,
        clientOptions
    );

    // Start the client and add it to the subscriptions for proper cleanup
    try {
        // Create a disposable that wraps the client start/stop
        const disposable = new vscode.Disposable(() => {
            client?.stop();
        });

        // Start the client
        await client.start();

        // Add our disposable to the extension context
        context.subscriptions.push(disposable);

        console.log(
            `${langConfig.displayName} language server started at: ${serverPath}`
        );
        if (serverArgs.length > 0) {
            console.log(`Language server arguments: ${serverArgs.join(" ")}`);
        }

        // Show info message when the server is ready
        vscode.window.showInformationMessage(
            `${langConfig.displayName} language server is now active`
        );
    } catch (error) {
        console.error(
            `Failed to start ${langConfig.displayName} language server:`,
            error
        );
        vscode.window.showErrorMessage(
            `Failed to start ${langConfig.displayName} language server: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}

/**
 * Stop the language server
 */
export function stopLanguageServer(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }

    console.log("Stopping NetLinx language server");
    return client.stop();
}
