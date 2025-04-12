import path from "node:path";
import fs from "node:fs";
import { workspace } from "vscode";

export interface CompilerConfig {
    compilerPath: string;
    includePaths: Array<string>;
    modulePaths: Array<string>;
    libraryPaths: Array<string>;
}

const DEFAULT_COMPILER_PATH =
    "C:/Program Files (x86)/Common Files/AMXShare/COM/NLRC.exe";

const DEFAULT_INCLUDE_PATHS = [
    "C:/Program Files (x86)/Common Files/AMXShare/AXIs",
];

const DEFAULT_MODULE_PATHS = [
    "C:/Program Files (x86)/Common Files/AMXShare/Duet/bundle",
    "C:/Program Files (x86)/Common Files/AMXShare/Duet/lib",
    "C:/Program Files (x86)/Common Files/AMXShare/Duet/module",
];

const DEFAULT_LIBRARY_PATHS = [
    "C:/Program Files (x86)/Common Files/AMXShare/SYCs",
];

export class Compiler {
    private static instance: Compiler | null = null;

    private readonly compilerPath: string;
    private readonly includePaths: Array<string>;
    private readonly modulePaths: Array<string>;
    private readonly libraryPaths: Array<string>;

    private constructor(config: CompilerConfig) {
        this.compilerPath = config.compilerPath;
        this.includePaths = config.includePaths;
        this.modulePaths = config.modulePaths;
        this.libraryPaths = config.libraryPaths;
    }

    private static initialize(): Compiler {
        const config = workspace.getConfiguration("netlinx");

        return new Compiler({
            compilerPath:
                config.get<string>("compilerPath") ?? DEFAULT_COMPILER_PATH,
            includePaths: [
                ...(config.get<Array<string>>("includePaths") ?? []),
                ...DEFAULT_INCLUDE_PATHS,
            ],
            modulePaths: [
                ...(config.get<Array<string>>("modulePaths") ?? []),
                ...DEFAULT_MODULE_PATHS,
            ],
            libraryPaths: [
                ...(config.get<Array<string>>("libraryPaths") ?? []),
                ...DEFAULT_LIBRARY_PATHS,
            ],
        });
    }

    public static getInstance(): Compiler {
        if (this.instance === null) {
            this.instance = this.initialize();
        }

        return this.instance;
    }

    public getBuildCommand(file: string): {
        path: string;
        args: Array<string>;
    } {
        const filePath = path.isAbsolute(file)
            ? file
            : path.resolve(workspace.workspaceFolders![0].uri.fsPath, file);

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const args = [`"${filePath}"`];

        args.push(`-I"${this.includePaths.join(";")}"`);
        args.push(`-M"${this.modulePaths.join(";")}"`);
        args.push(`-L"${this.libraryPaths.join(";")}"`);

        return {
            path: `"${this.compilerPath}"`,
            args: [...args],
        };
    }
}
