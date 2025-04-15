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
    context: vscode.ExtensionContext,
): Promise<void> {
    const config = vscode.workspace.getConfiguration("netlinx");
    const isEnabled = config.get<boolean>("languageServer.enabled", true);

    if (!isEnabled) {
        console.log("NetLinx language server is disabled in settings");
        return;
    }

    const langConfig = getLanguageConfiguration(context);

    // Get server path from settings
    // let serverPath = config.get<string>("languageServer.path", "/Users/damienbutt/Projects/netlinx-language-server/build/netlinx-language-server");
    let serverPath =
        "/Users/damienbutt/Projects/netlinx-language-server/build/netlinx-language-server";
    const serverArgs = config.get<string[]>("languageServer.args", []);

    console.log(serverPath || "netlinx-language-server doesn't exist");

    if (!serverPath) {
        const platform = os.platform();
        serverPath =
            platform === "win32"
                ? "netlinx-language-server.exe"
                : "netlinx-language-server";
        console.log(
            `No server path specified in settings, using default: ${serverPath}`,
        );
    } else {
        console.log(`Using language server path from settings: ${serverPath}`);
    }

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: "file", language: langConfig.id }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher(
                createFileExtensionGlob(langConfig.extensions),
            ),
        },
    };

    const serverOptions: ServerOptions = {
        command: serverPath,
        args: serverArgs,
        options: {
            shell: false,
        },
    };

    client = new LanguageClient(
        "netlinx-language-server",
        "NetLinx Language Server",
        serverOptions,
        clientOptions,
    );

    try {
        const disposable = new vscode.Disposable(() => {
            void client?.stop();
        });

        // Start the client
        await client.start();
        context.subscriptions.push(disposable);

        console.log(
            `${langConfig.displayName} language server started at: ${serverPath}`,
        );
        if (serverArgs.length > 0) {
            console.log(`Language server arguments: ${serverArgs.join(" ")}`);
        }

        // Show info message when the server is ready
        vscode.window.showInformationMessage(
            `${langConfig.displayName} language server is now active`,
        );
    } catch (error) {
        console.error(
            `Failed to start ${langConfig.displayName} language server:`,
            error,
        );
        vscode.window.showErrorMessage(
            `Failed to start ${langConfig.displayName} language server: ${
                error instanceof Error ? error.message : String(error)
            }`,
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

export async function getServerLogPath(): Promise<string | undefined> {
    if (!client) {
        throw new Error("Language server is not running");
    }

    try {
        return (await client.sendRequest("netlinx/serverLogPath")) as string;
    } catch (error) {
        console.error("Failed to get log path from server:", error);
        throw new Error(
            `Failed to get log path: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}
