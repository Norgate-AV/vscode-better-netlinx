import * as vscode from "vscode";
import { setupSyntaxFileWatchers } from "./FileWatcher";
import {
    registerTokenAnalyzerCommands,
    runAutoTokenAnalysis,
} from "./TokenAnalyzer";
import { startLanguageServer, stopLanguageServer } from "./LanguageClient";
import { getCommands } from "./Commands";
import { getTasks } from "./Tasks";

export async function activate(context: vscode.ExtensionContext) {
    const extensionName = "vscode-better-netlinx";
    console.log(`Extension "${extensionName}" is now active!`);

    try {
        // Show a notification that the extension is active
        vscode.window.showInformationMessage(
            `${extensionName} activated! NetLinx syntax highlighting enabled.`,
        );

        // Register commands
        context.subscriptions.push(...getCommands());

        // Register Tasks
        context.subscriptions.push(...getTasks());

        // Set up file watchers for syntax files
        context.subscriptions.push(...setupSyntaxFileWatchers(context));

        // Register token analyzer commands
        context.subscriptions.push(...registerTokenAnalyzerCommands(context));

        // Run automatic token analysis in development mode
        await runAutoTokenAnalysis(context);

        // Start the NetLinx language server
        await startLanguageServer(context);
    } catch (e) {
        console.error("Error during extension activation:", e);
    }
}

// This method is called when the extension is deactivated
export function deactivate() {
    console.log('Extension "vscode-better-netlinx" is now deactivated!');
    return stopLanguageServer();
}
