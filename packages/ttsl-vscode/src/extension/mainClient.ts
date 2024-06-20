import * as path from 'node:path';
import * as vscode from 'vscode';
import type { LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node.js';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';
import { getSafeDSOutputChannel, initializeLog } from './output.js';
import { dumpDiagnostics } from './commands/dumpDiagnostics.js';
import { openDiagnosticsDumps } from './commands/openDiagnosticsDumps.js';

let client: LanguageClient;

// This function is called when the extension is activated.
export const activate = async function (context: vscode.ExtensionContext) {
    initializeLog();
    client = startLanguageClient(context);
    acceptRunRequests(context);
};

// This function is called when the extension is deactivated.
export const deactivate = async function (): Promise<void> {
    if (client) {
        await client.stop();
    }
    return;
};

const startLanguageClient = function (context: vscode.ExtensionContext): LanguageClient {
    const serverModule = context.asAbsolutePath(path.join('dist', 'extension', 'mainServer.cjs'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = {
        execArgv: [
            '--nolazy',
            `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`,
        ],
    };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
    };

    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.ttsl');
    context.subscriptions.push(fileSystemWatcher);

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'safe-ds' }],
        synchronize: {
            // Notify the server about file changes to files contained in the workspace
            fileEvents: fileSystemWatcher,
        },
        outputChannel: getSafeDSOutputChannel('[LanguageClient] '),
    };

    // Create the language client and start the client.
    const result = new LanguageClient('safe-ds', 'Safe-DS', serverOptions, clientOptions);

    // Start the client. This will also launch the server
    result.start();
    return result;
};

const acceptRunRequests = function (context: vscode.ExtensionContext) {
    // Register VS Code Entry Points
    registerVSCodeCommands(context);
};

const registerVSCodeCommands = function (context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('ttsl.dumpDiagnostics', dumpDiagnostics(context)));
    context.subscriptions.push(
        vscode.commands.registerCommand('ttsl.openDiagnosticsDumps', openDiagnosticsDumps(context)),
    );
};
