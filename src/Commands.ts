import { commands, window, workspace } from "vscode";

export function getCommands() {
    const transfer = commands.registerCommand("netlinx.transfer", () => {
        void exec("transfer.location", "NetLinx Transfer");
    });

    const diagnostics = commands.registerCommand("netlinx.diagnostics", () => {
        void exec("diagnostics.location", "NetLinx Diagnostics");
    });

    const help = commands.registerCommand("netlinx.help", () => {
        void exec("help.location", "NetLinx Help");
    });

    return [help, transfer, diagnostics];
}

async function exec(key: string, name: string): Promise<void> {
    const config = workspace.getConfiguration("netlinx");
    const command = config.get<string>(key);

    if (!command) {
        window.showErrorMessage(`Command "${name}" is not configured.`);
        return;
    }

    try {
        const { execa } = await import("execa");
        await execa(command, { shell: true });
        window.showInformationMessage(`${name} command executed successfully.`);
    } catch (error: unknown) {
        window.showErrorMessage(
            `Error executing command: ${(error as Error).message || error}`,
        );
    }
}
