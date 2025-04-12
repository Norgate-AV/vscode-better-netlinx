import { Task, tasks, workspace, ShellExecution, TaskGroup } from "vscode";
import { Compiler } from "./Compiler";

export function getTasks() {
    return [
        tasks.registerTaskProvider("netlinx-build", {
            provideTasks: () => {
                return getBuildTasks();
            },
            resolveTask() {
                return undefined;
            },
        }),
    ];
}

function getBuildTasks(): Array<Task> {
    const workspaceFolders = workspace.workspaceFolders?.[0];

    if (!workspaceFolders) {
        return [];
    }

    const workspacePath = workspaceFolders.uri.fsPath;

    try {
        const { path: compilerPath, args: compilerArgs } =
            Compiler.getInstance().getBuildCommand(workspacePath);

        const task = new Task(
            {
                type: "netlinx-build",
                task: "Build NetLinx File",
            },
            workspaceFolders,
            "Build NetLinx File",
            "netlinx-build",
            new ShellExecution(`${compilerPath} ${compilerArgs.join(" ")}`),
            [],
        );

        task.group = TaskGroup.Build;

        return [task];
    } catch (error: unknown) {
        console.error(
            "Error creating build task:",
            (error as Error).message || error,
        );
        return [];
    }
}
