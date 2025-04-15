import * as vscode from "vscode";
import fs from "node:fs";
import os from "node:os";
import {
    LanguageClient,
    LanguageClientOptions,
    RevealOutputChannelOn,
    ServerOptions,
} from "vscode-languageclient/node";
import chokidar from "chokidar";
import {
    createFileExtensionGlob,
    getLanguageConfiguration,
} from "./ExtensionConfig";

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel | undefined;

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

    outputChannel = vscode.window.createOutputChannel(
        "NetLinx Language Server",
        { log: true },
    );

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: "file", language: langConfig.id }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher(
                createFileExtensionGlob(langConfig.extensions),
            ),
        },
        outputChannel,
        revealOutputChannelOn: RevealOutputChannelOn.Info,
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

        await setupLogFileWatcher(context);

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

    if (outputChannel) {
        outputChannel.dispose();
        outputChannel = undefined;
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

export function showOutputChannel(): void {
    if (outputChannel) {
        outputChannel.show();
    } else {
        vscode.window.showErrorMessage(
            "NetLinx Language Server output channel not available",
        );
    }
}

async function setupLogFileWatcher(
    context: vscode.ExtensionContext,
): Promise<void> {
    try {
        const logPath = await getServerLogPath();

        if (!logPath || !outputChannel) {
            console.error(
                "Can't set up log watcher - missing log path or output channel",
            );

            return;
        }

        let currentPosition = 0;

        if (!fs.existsSync(logPath)) {
            console.error(`Log file does not exist: ${logPath}`);
            return;
        }

        try {
            const stats = fs.statSync(logPath);
            const initialContent = fs.readFileSync(logPath, "utf8");
            outputChannel.append(initialContent);
            currentPosition = stats.size;
        } catch (err) {
            console.error("Error reading initial log file:", err);
        }

        const watcher = chokidar.watch(logPath, {
            persistent: true,
            awaitWriteFinish: { stabilityThreshold: 300 },
        });

        watcher.on("change", () => {
            if (!outputChannel) {
                return;
            }

            try {
                const stats = fs.statSync(logPath);

                // Handle file truncation
                if (stats.size < currentPosition) {
                    outputChannel.clear();
                    currentPosition = 0;
                }

                // Stream new content
                if (stats.size > currentPosition) {
                    const stream = fs.createReadStream(logPath, {
                        encoding: "utf8",
                        start: currentPosition,
                    });

                    stream.on("data", (chunk) =>
                        outputChannel?.append(chunk.toString()),
                    );

                    stream.on("end", () => {
                        currentPosition = stats.size;
                    });

                    stream.on("error", (err) => {
                        console.error("Stream error:", err);
                    });
                }
            } catch (err) {
                console.error("Error updating log:", err);
            }
        });

        context.subscriptions.push(
            new vscode.Disposable(() => watcher.close()),
        );

        console.log(`Set up watcher for log file at: ${logPath}`);
    } catch (err) {
        console.error("Error setting up log file watcher:", err);
    }
}
