import { TTSLServices } from '../ttsl-module.js';
import { AstNodeLocator, AstUtils, LangiumDocument, LangiumDocuments, URI } from 'langium';
import path from 'path';
import {
    createPlaceholderQueryMessage,
    createProgramMessage,
    PlaceholderValueMessage,
    ProgramCodeMap,
    RuntimeErrorBacktraceFrame,
    RuntimeErrorMessage,
} from './messages.js';
import { SourceMapConsumer } from 'source-map-js';
import { TTSLPythonGenerator } from '../generation/ttsl-python-generator.js';
import { isTslFunction, isTslModule, isTslPlaceholder } from '../generated/ast.js';
import { TTSLLogger, TTSLMessagingProvider } from '../communication/ttsl-messaging-provider.js';
import crypto from 'crypto';
import { TTSLPythonServer } from './ttsl-python-server.js';
import { IsRunnerReadyRequest, ShowImageNotification } from '../communication/rpc.js';
import { expandToStringLF, joinToNode } from 'langium/generate';
import { TTSLFunction } from '../builtins/ttsl-functions.js';

// Most of the functionality cannot be tested automatically as a functioning runner setup would always be required

const RUNNER_TAG = 'Runner';

/* c8 ignore start */
export class TTSLRunner {
    private readonly astNodeLocator: AstNodeLocator;
    private readonly generator: TTSLPythonGenerator;
    private readonly langiumDocuments: LangiumDocuments;
    private readonly logger: TTSLLogger;
    private readonly messaging: TTSLMessagingProvider;
    private readonly pythonServer: TTSLPythonServer;
    private readonly ttslFunct: TTSLFunction;

    constructor(services: TTSLServices) {
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.generator = services.generation.PythonGenerator;
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.logger = services.communication.MessagingProvider.createTaggedLogger(RUNNER_TAG);
        this.messaging = services.communication.MessagingProvider;
        this.pythonServer = services.runtime.PythonServer;
        this.ttslFunct = services.builtins.Functions;

        this.registerMessageLoggingCallbacks();

        this.messaging.onRequest(IsRunnerReadyRequest.type, () => {
            return this.isReady();
        });
    }

    /**
     * Check if the runner is ready to execute functions.
     */
    isReady(): boolean {
        return this.pythonServer.isStarted;
    }

    async runFunction(documentUri: string, nodePath: string) {
        const uri = URI.parse(documentUri);
        const document = await this.langiumDocuments.getOrCreateDocument(uri);
        if (!document) {
            this.messaging.showErrorMessage('Could not find document.');
            return;
        }

        const root = document.parseResult.value;
        const funct = this.astNodeLocator.getAstNode(root, nodePath);
        if (!isTslFunction(funct)) {
            this.messaging.showErrorMessage('Selected node is not a function.');
            return;
        }

        const functExecutionId = crypto.randomUUID();

        const start = Date.now();
        const progress = await this.messaging.showProgress('TTSL Runner', 'Starting...');
        this.logger.info(`[${functExecutionId}] Running function "${funct.name}" in ${documentUri}.`);

        const disposables = [
            this.pythonServer.addMessageCallback('placeholder_type', (message) => {
                if (message.id === functExecutionId) {
                    progress.report(`Computed ${message.data.name}`);
                }
            }),

            this.pythonServer.addMessageCallback('runtime_error', (message) => {
                if (message.id === functExecutionId) {
                    progress?.done();
                    disposables.forEach((it) => {
                        it.dispose();
                    });
                    this.messaging.showErrorMessage('An error occurred during function execution.');
                }
                progress.done();
                disposables.forEach((it) => {
                    it.dispose();
                });
            }),

            this.pythonServer.addMessageCallback('runtime_progress', (message) => {
                if (message.id === functExecutionId) {
                    progress.done();
                    const timeElapsed = Date.now() - start;
                    this.logger.info(
                        `[${functExecutionId}] Finished running function "${funct.name}" in ${timeElapsed}ms.`,
                    );
                    disposables.forEach((it) => {
                        it.dispose();
                    });
                }
            }),
        ];

        await this.executeFunction(functExecutionId, document, funct.name);
    }

    async printValue(documentUri: string, nodePath: string) {
        const uri = URI.parse(documentUri);
        const document = this.langiumDocuments.getDocument(uri);
        if (!document) {
            this.messaging.showErrorMessage('Could not find document.');
            return;
        }

        const root = document.parseResult.value;
        const placeholder = this.astNodeLocator.getAstNode(root, nodePath);
        if (!isTslPlaceholder(placeholder)) {
            this.messaging.showErrorMessage('Selected node is not a placeholder.');
            return;
        }

        const funct = AstUtils.getContainerOfType(placeholder, isTslFunction);
        if (!funct) {
            this.messaging.showErrorMessage('Could not find function.');
            return;
        }

        const functExecutionId = crypto.randomUUID();

        const start = Date.now();

        const progress = await this.messaging.showProgress('TTSL Runner', 'Starting...');

        this.logger.info(`[${functExecutionId}] Printing value "${funct.name}/${placeholder.name}" in ${documentUri}.`);

        const disposables = [
            this.pythonServer.addMessageCallback('runtime_error', (message) => {
                if (message.id === functExecutionId) {
                    progress?.done();
                    disposables.forEach((it) => {
                        it.dispose();
                    });
                    this.messaging.showErrorMessage('An error occurred during function execution.');
                }
                progress.done();
                disposables.forEach((it) => {
                    it.dispose();
                });
            }),

            this.pythonServer.addMessageCallback('placeholder_type', async (message) => {
                if (message.id === functExecutionId && message.data.name === placeholder.name) {
                    const data = await this.getPlaceholderValue(placeholder.name, functExecutionId);
                    this.logger.result(`val ${placeholder.name} = ${JSON.stringify(data, null, 2)};`);
                }
            }),

            this.pythonServer.addMessageCallback('runtime_progress', (message) => {
                if (message.id === functExecutionId) {
                    progress.done();
                    const timeElapsed = Date.now() - start;
                    this.logger.info(
                        `[${functExecutionId}] Finished printing value "${funct.name}/${placeholder.name}" in ${timeElapsed}ms.`,
                    );
                    disposables.forEach((it) => {
                        it.dispose();
                    });
                }
            }),
        ];

        await this.executeFunction(functExecutionId, document, funct.name, [placeholder.name]);
    }

    async showImage(documentUri: string, nodePath: string) {
        const uri = URI.parse(documentUri);
        const document = this.langiumDocuments.getDocument(uri);
        if (!document) {
            this.messaging.showErrorMessage('Could not find document.');
            return;
        }

        const root = document.parseResult.value;
        const placeholder = this.astNodeLocator.getAstNode(root, nodePath);
        if (!isTslPlaceholder(placeholder)) {
            this.messaging.showErrorMessage('Selected node is not a placeholder.');
            return;
        }

        const funct = AstUtils.getContainerOfType(placeholder, isTslFunction);
        if (!funct) {
            this.messaging.showErrorMessage('Could not find function.');
            return;
        }

        const functExecutionId = crypto.randomUUID();

        const start = Date.now();

        const progress = await this.messaging.showProgress('TTSL Runner', 'Starting...');

        this.logger.info(`[${functExecutionId}] Showing image "${funct.name}/${placeholder.name}" in ${documentUri}.`);

        const disposables = [
            this.pythonServer.addMessageCallback('runtime_error', (message) => {
                if (message.id === functExecutionId) {
                    progress?.done();
                    disposables.forEach((it) => {
                        it.dispose();
                    });
                    this.messaging.showErrorMessage('An error occurred during function execution.');
                }
                progress.done();
                disposables.forEach((it) => {
                    it.dispose();
                });
            }),

            this.pythonServer.addMessageCallback('placeholder_type', async (message) => {
                if (message.id === functExecutionId && message.data.name === placeholder.name) {
                    const data = await this.getPlaceholderValue(placeholder.name, functExecutionId);
                    await this.messaging.sendNotification(ShowImageNotification.type, { image: data });
                }
            }),

            this.pythonServer.addMessageCallback('runtime_progress', (message) => {
                if (message.id === functExecutionId) {
                    progress.done();
                    const timeElapsed = Date.now() - start;
                    this.logger.info(
                        `[${functExecutionId}] Finished showing image "${funct.name}/${placeholder.name}" in ${timeElapsed}ms.`,
                    );
                    disposables.forEach((it) => {
                        it.dispose();
                    });
                }
            }),
        ];

        await this.executeFunction(functExecutionId, document, funct.name, [placeholder.name]);
    }

    private async getPlaceholderValue(placeholder: string, functExecutionId: string): Promise<any | undefined> {
        return new Promise((resolve) => {
            if (placeholder === '') {
                resolve(undefined);
            }

            const placeholderValueCallback = (message: PlaceholderValueMessage) => {
                if (message.id !== functExecutionId || message.data.name !== placeholder) {
                    return;
                }
                this.pythonServer.removeMessageCallback('placeholder_value', placeholderValueCallback);
                resolve(message.data.value);
            };

            this.pythonServer.addMessageCallback('placeholder_value', placeholderValueCallback);
            this.logger.info('Getting placeholder from Runner ...');
            this.pythonServer.sendMessageToPythonServer(createPlaceholderQueryMessage(functExecutionId, placeholder));

            setTimeout(() => {
                resolve(undefined);
            }, 30000);
        });
    }

    /**
     * Map that contains information about an execution keyed by the execution id.
     */
    public executionInformation: Map<string, FunctionExecutionInformation> = new Map<
        string,
        FunctionExecutionInformation
    >();

    /**
     * Get information about a function execution.
     *
     * @param functId Unique id that identifies a function execution
     * @return Execution context assigned to the provided id.
     */
    public getExecutionContext(functId: string): FunctionExecutionInformation | undefined {
        return this.executionInformation.get(functId);
    }

    /**
     * Remove information from a function execution, when it is no longer needed.
     *
     * @param functId Unique id that identifies a function execution
     */
    public dropFunctionExecutionContext(functId: string) {
        this.executionInformation.delete(functId);
    }

    /**
     * Remove information from all previous function executions.
     */
    public dropAllFunctionExecutionContexts() {
        this.executionInformation.clear();
    }

    /**
     * Execute a TTSL function on the python runner.
     * If a valid target placeholder is provided, the function is only executed partially, to calculate the result of the placeholder.
     *
     * @param id A unique id that is used in further communication with this function.
     * @param functDocument Document containing the main TTSL function to execute.
     * @param functName Name of the function that should be run
     * @param targetPlaceholders The names of the target placeholders, used to do partial execution. If undefined is provided, the entire function is run.
     */
    public async executeFunction(
        id: string,
        functDocument: LangiumDocument,
        functName: string,
        targetPlaceholders: string[] | undefined = undefined,
        params: string[] = [],
    ) {
        const node = functDocument.parseResult.value;
        if (!isTslModule(node)) {
            return;
        }
        // Function / Module name handling
        const mainPythonModuleName = this.ttslFunct.getPythonModule(node);
        const mainPackage = mainPythonModuleName === undefined ? node.name.split('.') : [mainPythonModuleName];
        const mainModuleName = this.getMainModuleName(functDocument);
        // Code generation
        const [codeMap, lastGeneratedSources] = this.generateCodeForRunner(functDocument, targetPlaceholders, params);
        // Store information about the run
        this.executionInformation.set(id, {
            generatedSource: lastGeneratedSources,
            sourceMappings: new Map<string, SourceMapConsumer>(),
            path: functDocument.uri.fsPath,
            source: functDocument.textDocument.getText(),
            calculatedPlaceholders: new Map<string, string>(),
        });
        // Code execution
        this.pythonServer.sendMessageToPythonServer(
            createProgramMessage(id, {
                code: codeMap,
                main: {
                    modulepath: mainPackage.join('.'),
                    module: mainModuleName,
                    funct: functName,
                },
                cwd: path.parse(functDocument.uri.fsPath).dir,
            }),
        );
    }

    private registerMessageLoggingCallbacks() {
        this.pythonServer.addMessageCallback('placeholder_value', (message) => {
            this.logger.trace(
                `Placeholder value is (${message.id}): ${message.data.name} of type ${message.data.type} = ${message.data.value}`,
                undefined,
            );
        });
        this.pythonServer.addMessageCallback('placeholder_type', (message) => {
            this.logger.trace(
                `Placeholder was calculated (${message.id}): ${message.data.name} of type ${message.data.type}`,
                undefined,
            );
            const execInfo = this.getExecutionContext(message.id);
            execInfo?.calculatedPlaceholders.set(message.data.name, message.data.type);
            // this.sendMessageToPythonServer(
            //    messages.createPlaceholderQueryMessage(message.id, message.data.name),
            //);
        });
        this.pythonServer.addMessageCallback('runtime_progress', (message) => {
            this.logger.trace(`Runner-Progress (${message.id}): ${message.data}`, undefined);
        });
        this.pythonServer.addMessageCallback('runtime_error', async (message) => {
            let readableStacktraceTTSL: string[] = [];
            const execInfo = this.getExecutionContext(message.id)!;
            const readableStacktracePython = await Promise.all(
                (<RuntimeErrorMessage>message).data.backtrace.map(async (frame) => {
                    const mappedFrame = await this.tryMapToSafeDSSource(message.id, frame);
                    if (mappedFrame) {
                        readableStacktraceTTSL.push(
                            `\tat ${URI.file(execInfo.path)}#${mappedFrame.line} (${execInfo.path} line ${
                                mappedFrame.line
                            })`,
                        );
                        return `\tat ${frame.file} line ${frame.line} (mapped to '${mappedFrame.file}' line ${mappedFrame.line})`;
                    }
                    return `\tat ${frame.file} line ${frame.line}`;
                }),
            );
            this.logger.debug(
                `[${message.id}] ${
                    (<RuntimeErrorMessage>message).data.message
                }\n${readableStacktracePython.join('\n')}`,
            );

            this.prettyPrintRuntimeError(message, readableStacktraceTTSL);
        });
    }

    private prettyPrintRuntimeError(message: RuntimeErrorMessage, readableStacktraceTTSL: string[]) {
        const lines = [...message.data.message.split('\n'), ...readableStacktraceTTSL.reverse()].map((it) =>
            it.replace('\t', '    '),
        );

        this.logger.result(
            expandToStringLF`
                // ----- Runtime Error ---------------------------------------------------------
                ${joinToNode(lines, { prefix: '// ', appendNewLineIfNotEmpty: true, skipNewLineAfterLastItem: true })}
                // -----------------------------------------------------------------------------
            `,
        );
    }

    /**
     * Map a stack frame from python to TTSL.
     * Uses generated sourcemaps to do this.
     * If such a mapping does not exist, this function returns undefined.
     *
     * @param executionId Id that uniquely identifies the execution that produced this stack frame
     * @param frame Stack frame from the python execution
     */
    private async tryMapToSafeDSSource(
        executionId: string,
        frame: RuntimeErrorBacktraceFrame | undefined,
    ): Promise<RuntimeErrorBacktraceFrame | undefined> {
        if (!frame) {
            return undefined;
        }
        if (!this.executionInformation.has(executionId)) {
            return undefined;
        }
        const execInfo = this.executionInformation.get(executionId)!;
        let sourceMapKeys = Array.from(execInfo.generatedSource.keys() || []).filter((value) =>
            value.endsWith(`${frame.file}.py.map`),
        );
        if (sourceMapKeys.length === 0) {
            return undefined;
        }
        let sourceMapKey = sourceMapKeys[0]!;
        if (!execInfo.sourceMappings.has(sourceMapKey)) {
            const sourceMapObject = JSON.parse(execInfo.generatedSource.get(sourceMapKey)!);
            sourceMapObject.sourcesContent = [execInfo.source];
            const consumer = new SourceMapConsumer(sourceMapObject);
            execInfo.sourceMappings.set(sourceMapKey, consumer);
        }
        const outputPosition = execInfo.sourceMappings.get(sourceMapKey)!.originalPositionFor({
            line: Number(frame.line),
            column: 0,
            bias: SourceMapConsumer.LEAST_UPPER_BOUND,
        });
        return { file: outputPosition.source || '<unknown>', line: outputPosition.line || 0 };
    }

    public generateCodeForRunner(
        functDocument: LangiumDocument,
        targetPlaceholder: string[] | undefined,
        params: string[] = [],
    ): [ProgramCodeMap, Map<string, string>] {
        const rootGenerationDir = path.parse(functDocument.uri.fsPath).dir;
        const generatedDocuments = this.generator.generate(
            functDocument,
            {
                destination: URI.file(rootGenerationDir), // actual directory of main module file
                createSourceMaps: true,
                targetPlaceholder,
                disableRunnerIntegration: false,
            },
            params,
        );
        const lastGeneratedSources = new Map<string, string>();
        let codeMap: ProgramCodeMap = {};
        for (const generatedDocument of generatedDocuments) {
            const fsPath = URI.parse(generatedDocument.uri).fsPath;
            const workspaceRelativeFilePath = path.relative(rootGenerationDir, path.dirname(fsPath));
            const ttslFileName = path.basename(fsPath);
            const ttslNoExtFilename =
                path.extname(ttslFileName).length > 0
                    ? ttslFileName.substring(0, ttslFileName.length - path.extname(ttslFileName).length)
                    : /* c8 ignore next */
                      ttslFileName;
            // Put code in map for further use in the extension (e.g. to remap errors)
            lastGeneratedSources.set(
                path.join(workspaceRelativeFilePath, ttslFileName).replaceAll('\\', '/'),
                generatedDocument.getText(),
            );
            // Check for sourcemaps after they are already added to the function context
            // This needs to happen after lastGeneratedSources.set, as errors would not get mapped otherwise
            if (fsPath.endsWith('.map')) {
                // exclude sourcemaps from sending to runner
                continue;
            }
            let modulePath = workspaceRelativeFilePath.replaceAll('/', '.').replaceAll('\\', '.');
            if (!codeMap.hasOwnProperty(modulePath)) {
                codeMap[modulePath] = {};
            }
            // Put code in object for runner
            codeMap[modulePath]![ttslNoExtFilename] = generatedDocument.getText();
        }
        return [codeMap, lastGeneratedSources];
    }

    public getMainModuleName(functDocument: LangiumDocument): string {
        if (functDocument.uri.fsPath.endsWith('.ttsl')) {
            return this.generator.sanitizeModuleNameForPython(path.basename(functDocument.uri.fsPath, '.ttsl'));
        } else {
            return this.generator.sanitizeModuleNameForPython(path.basename(functDocument.uri.fsPath));
        }
    }
}

/**
 * Context containing information about the execution of a function.
 */
export interface FunctionExecutionInformation {
    source: string;
    generatedSource: Map<string, string>;
    sourceMappings: Map<string, SourceMapConsumer>;
    path: string;
    /**
     * Maps placeholder name to placeholder type
     */
    calculatedPlaceholders: Map<string, string>;
}

/* c8 ignore stop */
