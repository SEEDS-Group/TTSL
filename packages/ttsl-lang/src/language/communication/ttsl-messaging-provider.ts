import { TTSLServices } from '../ttsl-module.js';
import {
    CancellationToken,
    Connection,
    Disposable,
    MessageActionItem,
    NotificationHandler,
    NotificationHandler0,
    NotificationType,
    NotificationType0,
    RequestHandler,
    RequestHandler0,
    RequestType,
    RequestType0,
    WorkDoneProgressReporter,
} from 'vscode-languageserver';
import { GenericRequestHandler } from 'vscode-jsonrpc/lib/common/connection.js';
import { GenericNotificationHandler } from 'vscode-languageserver-protocol';

/**
 * Log or show messages in the language client or otherwise communicate with it.
 */
export class TTSLMessagingProvider {
    private readonly connection: Connection | undefined;
    private logger: Partial<TTSLLogger> | undefined = undefined;
    private userInteractionProvider: Partial<TTSLUserInteractionProvider> | undefined = undefined;
    private messageBroker: Partial<TTSLMessageBroker> | undefined = undefined;

    constructor(services: TTSLServices) {
        this.connection = services.shared.lsp.Connection;
    }

    // Logging ---------------------------------------------------------------------------------------------------------

    /**
     * Create a logger that prepends all messages with the given tag.
     */
    createTaggedLogger(tag: string): TTSLLogger {
        return {
            trace: (message: string, verbose?: string) => this.trace(tag, message, verbose),
            debug: (message: string) => this.debug(tag, message),
            info: (message: string) => this.info(tag, message),
            warn: (message: string) => this.warn(tag, message),
            error: (message: string) => this.error(tag, message),
            result: (message: string) => this.result(message),
        };
    }

    /**
     * Log the given data to the trace log.
     */
    trace(tag: string, message: string, verbose?: string): void {
        const text = this.formatLogMessage(tag, message);
        if (this.logger?.trace) {
            this.logger.trace(text, verbose);
        } else if (this.connection) {
            /* c8 ignore next 2 */
            this.connection.tracer.log(text, verbose);
        }
    }

    /**
     * Log a debug message.
     */
    debug(tag: string, message: string): void {
        const text = this.formatLogMessage(tag, message);
        if (this.logger?.debug) {
            this.logger.debug(text);
        } else if (this.connection) {
            /* c8 ignore next 2 */
            this.connection.console.debug(text);
        }
    }

    /**
     * Log an information message.
     */
    info(tag: string, message: string): void {
        const text = this.formatLogMessage(tag, message);
        if (this.logger?.info) {
            this.logger.info(text);
        } else if (this.connection) {
            /* c8 ignore next 2 */
            this.connection.console.info(text);
        }
    }

    /**
     * Log a warning message.
     */
    warn(tag: string, message: string): void {
        const text = this.formatLogMessage(tag, message);
        if (this.logger?.warn) {
            this.logger.warn(text);
        } else if (this.connection) {
            /* c8 ignore next 2 */
            this.connection.console.warn(text);
        }
    }

    /**
     * Log an error message.
     */
    error(tag: string, message: string): void {
        const text = this.formatLogMessage(tag, message);
        if (this.logger?.error) {
            this.logger.error(text);
        } else if (this.connection) {
            /* c8 ignore next 2 */
            this.connection.console.error(text);
        }
    }

    /**
     * Show a result to the user.
     */
    result(message: string): void {
        const text = this.formatLogMessage('Result', message) + '\n';
        if (this.logger?.result) {
            this.logger.result(text);
        } else if (this.connection) {
            /* c8 ignore next 2 */
            this.connection.console.log(text);
        }
    }

    private formatLogMessage(tag: string, message: string): string {
        return tag ? `[${tag}] ${message}` : message;
    }

    // User interaction ------------------------------------------------------------------------------------------------

    /**
     * Shows an information message in the client's user interface.
     *
     * Depending on the client this might be a modal dialog with a confirmation button or a notification in a
     * notification center.
     *
     * @param message The message to show.
     */
    showInformationMessage(message: string): void;
    /**
     * Shows an information message in the client's user interface.
     *
     * Depending on the client this might be a modal dialog with a confirmation button or a notification in a
     * notification center.
     *
     * @param message The message to show.
     * @param actions The actions to show.
     *
     * @returns A promise that resolves to the selected action.
     */
    showInformationMessage<T extends MessageActionItem>(message: string, ...actions: T[]): Promise<T | undefined>;
    async showInformationMessage<T extends MessageActionItem>(
        message: string,
        ...actions: T[]
    ): Promise<T | undefined> {
        if (this.userInteractionProvider?.showInformationMessage) {
            return this.userInteractionProvider.showInformationMessage(message, ...actions);
        } /* c8 ignore start */ else if (this.connection) {
            return this.connection.window.showInformationMessage(message, ...actions);
        } else {
            return undefined;
        } /* c8 ignore stop */
    }

    /**
     * Shows a warning message in the client's user interface.
     *
     * Depending on the client this might be a modal dialog with a confirmation button or a notification in a
     * notification center.
     *
     * @param message The message to show.
     *
     * @returns A promise that resolves to the selected action.
     */
    showWarningMessage(message: string): void;
    /**
     * Shows a warning message in the client's user interface.
     *
     * Depending on the client this might be a modal dialog with a confirmation button or a notification in a
     * notification center.
     *
     * @param message The message to show.
     * @param actions The actions to show.
     *
     * @returns A promise that resolves to the selected action.
     */
    showWarningMessage<T extends MessageActionItem>(message: string, ...actions: T[]): Promise<T | undefined>;
    async showWarningMessage<T extends MessageActionItem>(message: string, ...actions: T[]): Promise<T | undefined> {
        if (this.userInteractionProvider?.showWarningMessage) {
            return this.userInteractionProvider.showWarningMessage(message, ...actions);
        } /* c8 ignore start */ else if (this.connection) {
            return this.connection.window.showWarningMessage(message, ...actions);
        } else {
            return undefined;
        } /* c8 ignore stop */
    }

    /**
     * Shows an error message in the client's user interface.
     *
     * Depending on the client this might be a modal dialog with a confirmation button or a notification in a
     * notification center.
     *
     * @param message The message to show.
     *
     * @returns A promise that resolves to the selected action.
     */
    showErrorMessage(message: string): void;
    /**
     * Shows an error message in the client's user interface.
     *
     * Depending on the client this might be a modal dialog with a confirmation button or a notification in a
     * notification center.
     *
     * @param message The message to show.
     * @param actions The actions to show.
     *
     * @returns A promise that resolves to the selected action.
     */
    showErrorMessage<T extends MessageActionItem>(message: string, ...actions: T[]): Promise<T | undefined>;
    async showErrorMessage<T extends MessageActionItem>(message: string, ...actions: T[]): Promise<T | undefined> {
        if (this.userInteractionProvider?.showErrorMessage) {
            return this.userInteractionProvider.showErrorMessage(message, ...actions);
        } /* c8 ignore start */ else if (this.connection) {
            return this.connection.window.showErrorMessage(message, ...actions);
        } else {
            return undefined;
        } /* c8 ignore stop */
    }

    /**
     * Shows a progress indicator in the client's user interface.
     *
     * @param title
     * The title of the progress indicator.
     *
     * @param message
     * An optional message to indicate what is currently being done.
     *
     * @param cancellable
     * Whether the progress indicator should be cancellable. Observe the `token` inside the returned reporter to check
     * if the user has cancelled the progress indicator.
     *
     * @returns
     * A promise that resolves to the progress reporter. Use this reporter to update the progress indicator.
     */
    async showProgress(
        title: string,
        message?: string,
        cancellable: boolean = false,
    ): Promise<WorkDoneProgressReporter> {
        if (this.userInteractionProvider?.showProgress) {
            return this.userInteractionProvider.showProgress(title, 0, message, cancellable);
        } /* c8 ignore start */ else if (this.connection) {
            const reporter = await this.connection.window.createWorkDoneProgress();
            reporter?.begin(title, 0, message, cancellable);
            return reporter;
        } else {
            return NOOP_PROGRESS_REPORTER;
        } /* c8 ignore stop */
    }

    // Message broker --------------------------------------------------------------------------------------------------

    /**
     * Installs a notification handler for the given method.
     *
     * @param type The method to register a request handler for.
     * @param handler The handler to install.
     */
    onNotification(type: NotificationType0, handler: NotificationHandler0): Disposable;
    /**
     * Installs a notification handler for the given method.
     *
     * @param type The method to register a request handler for.
     * @param handler The handler to install.
     */
    onNotification<P>(type: NotificationType<P>, handler: NotificationHandler<P>): Disposable;
    onNotification<P>(
        type: NotificationType0 | NotificationType<P>,
        handler: NotificationHandler0 | NotificationHandler<P>,
    ): Disposable {
        if (this.messageBroker?.onNotification) {
            return this.messageBroker.onNotification(type.method, handler);
        } else if (this.connection) {
            /* c8 ignore next 2 */
            return this.connection.onNotification(type.method, handler);
        } else {
            return NOOP_DISPOSABLE;
        }
    }

    /**
     * Send a notification to the client.
     *
     * @param type The method to invoke on the client.
     */
    sendNotification(type: NotificationType0): Promise<void>;
    /**
     * Send a notification to the client.
     *
     * @param type The method to invoke on the client.
     * @param args The arguments.
     */
    sendNotification<P>(type: NotificationType<P>, args: P): Promise<void>;
    async sendNotification<P>(type: NotificationType0 | NotificationType<P>, args?: P): Promise<void> {
        if (this.messageBroker?.sendNotification) {
            await this.messageBroker.sendNotification(type.method, args);
        } else if (this.connection) {
            /* c8 ignore next 2 */
            await this.connection.sendNotification(type.method, args);
        }
    }

    /**
     * Installs a request handler for the given method.
     *
     * @param type The method to register a request handler for.
     * @param handler The handler to install.
     */
    onRequest<R, E>(type: RequestType0<R, E>, handler: RequestHandler0<R, E>): Disposable;
    /**
     * Installs a request handler for the given method.
     *
     * @param type The method to register a request handler for.
     * @param handler The handler to install.
     */
    onRequest<P, R, E>(type: RequestType<P, R, E>, handler: RequestHandler<P, R, E>): Disposable;
    onRequest<P, R, E>(
        type: RequestType0<R, E> | RequestType<P, R, E>,
        handler: RequestHandler0<R, E> | RequestHandler<P, R, E>,
    ): Disposable {
        if (this.messageBroker?.onRequest) {
            return this.messageBroker.onRequest(type.method, handler);
        } else if (this.connection) {
            /* c8 ignore next 2 */
            return this.connection.onRequest(type.method, handler);
        } else {
            return NOOP_DISPOSABLE;
        }
    }

    /**
     * Send a request to the client.
     *
     * @param type The method to register a request handler for.
     * @param token A cancellation token that can be used to cancel the request.
     *
     * @returns A promise that resolves to the response.
     */
    sendRequest<R, E>(type: RequestType0<R, E>, token?: CancellationToken): Promise<R>;
    /**
     * Send a request to the client.
     *
     * @param type The method to register a request handler for.
     * @param args The arguments.
     * @param token A cancellation token that can be used to cancel the request.
     *
     * @returns A promise that resolves to the response.
     */
    sendRequest<P, R, E>(type: RequestType<P, R, E>, args: P, token?: CancellationToken): Promise<R>;
    async sendRequest<P, R, E>(
        type: RequestType0<R, E> | RequestType<P, R, E>,
        argsOrToken?: P | CancellationToken,
        token?: CancellationToken,
    ): Promise<any> {
        if (this.messageBroker?.sendRequest) {
            if (CancellationToken.is(argsOrToken) && !token) {
                return this.messageBroker.sendRequest(type.method, undefined, argsOrToken);
            } else {
                return this.messageBroker.sendRequest(type.method, argsOrToken, token);
            }
        } else if (this.connection) {
            /* c8 ignore next 2 */
            return this.connection.sendRequest(type.method, argsOrToken, token);
        } else {
            /* c8 ignore next 2 */
            return undefined;
        }
    }

    // Configuration ---------------------------------------------------------------------------------------------------

    /**
     * Set the logger to use for logging messages.
     */
    setLogger(logger: Partial<TTSLLogger>) {
        this.logger = logger;
    }

    /**
     * Set the service to interact with the user.
     */
    setUserInteractionProvider(userInteractionProvider: Partial<TTSLUserInteractionProvider>) {
        this.userInteractionProvider = userInteractionProvider;
    }

    /**
     * Set the message broker to use for communicating with the client.
     */
    setMessageBroker(messageBroker: Partial<TTSLMessageBroker>) {
        this.messageBroker = messageBroker;
    }
}

/**
 * A logging provider.
 */
export interface TTSLLogger {
    /**
     * Log the given data to the trace log.
     */
    trace: (message: string, verbose?: string) => void;

    /**
     * Log a debug message.
     */
    debug: (message: string) => void;

    /**
     * Log an information message.
     */
    info: (message: string) => void;

    /**
     * Log a warning message.
     */
    warn: (message: string) => void;

    /**
     * Log an error message.
     */
    error: (message: string) => void;

    /**
     * Show a result to the user.
     */
    result: (message: string) => void;
}

/**
 * A service for showing messages to the user.
 */
export interface TTSLUserInteractionProvider {
    /**
     * Prominently show an information message. The message should be short and human-readable.
     *
     * @returns
     * A thenable that resolves to the selected action.
     */
    showInformationMessage: <T extends MessageActionItem>(message: string, ...actions: T[]) => Thenable<T | undefined>;

    /**
     * Prominently show a warning message. The message should be short and human-readable.
     *
     * @returns
     * A thenable that resolves to the selected action.
     */
    showWarningMessage: <T extends MessageActionItem>(message: string, ...actions: T[]) => Thenable<T | undefined>;

    /**
     * Prominently show an error message. The message should be short and human-readable.
     *
     * @returns
     * A thenable that resolves to the selected action.
     */
    showErrorMessage: <T extends MessageActionItem>(message: string, ...actions: T[]) => Thenable<T | undefined>;

    /**
     * Shows a progress indicator in the client's user interface.
     *
     * @param title
     * The title of the progress indicator.
     *
     * @param message
     * An optional message to indicate what is currently being done.
     *
     * @param cancellable
     * Whether the progress indicator should be cancellable. Observe the `token` inside the returned reporter to check
     * if the user has cancelled the progress indicator.
     *
     * @returns
     * A thenable that resolves to the progress reporter. Use this reporter to update the progress indicator.
     */
    showProgress: (
        title: string,
        percentage?: number,
        message?: string,
        cancellable?: boolean,
    ) => Thenable<WorkDoneProgressReporter>;
}

/**
 * A message broker for communicating with the client.
 */
export interface TTSLMessageBroker {
    /**
     * Installs a notification handler for the given method.
     *
     * @param method The method to register a request handler for.
     * @param handler The handler to install.
     */
    onNotification: (method: string, handler: GenericNotificationHandler) => Disposable;

    /**
     * Send a notification to the client.
     *
     * @param method The method to invoke on the client.
     * @param args The arguments.
     */
    sendNotification: (method: string, args?: any) => Promise<void>;

    /**
     * Installs a request handler for the given method.
     *
     * @param method The method to register a request handler for.
     * @param handler The handler to install.
     */
    onRequest: <R, E>(method: string, handler: GenericRequestHandler<R, E>) => Disposable;

    /**
     * Send a request to the client.
     *
     * @param method The method to register a request handler for.
     * @param args The arguments.
     * @param token A cancellation token that can be used to cancel the request.
     *
     * @returns A promise that resolves to the response.
     */
    sendRequest<R>(method: string, args: any, token?: CancellationToken): Promise<R>;
}

const NOOP_PROGRESS_REPORTER: WorkDoneProgressReporter = {
    begin() {},
    report() {},
    done() {},
};

const NOOP_DISPOSABLE: Disposable = Disposable.create(() => {});
