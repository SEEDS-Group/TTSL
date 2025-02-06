import { AbstractExecuteCommandHandler, ExecuteCommandAcceptor } from 'langium/lsp';
import { TTSLSharedServices } from '../ttsl-module.js';
import { TTSLRunner } from '../runtime/ttsl-runner.js';
import { COMMAND_PRINT_VALUE, COMMAND_RUN_FUNCTION, COMMAND_SHOW_IMAGE } from '../communication/commands.js';

/* c8 ignore start */
export class SafeDsExecuteCommandHandler extends AbstractExecuteCommandHandler {
    private readonly runner: TTSLRunner;

    constructor(sharedServices: TTSLSharedServices) {
        super();

        const services = sharedServices.ServiceRegistry.getTTSLServices();
        this.runner = services.runtime.Runner;
    }

    override registerCommands(acceptor: ExecuteCommandAcceptor) {
        acceptor(COMMAND_PRINT_VALUE, ([documentUri, nodePath]) => this.runner.printValue(documentUri, nodePath));
        acceptor(COMMAND_RUN_FUNCTION, ([documentUri, nodePath]) => this.runner.runFunction(documentUri, nodePath));
        acceptor(COMMAND_SHOW_IMAGE, ([documentUri, nodePath]) => this.runner.showImage(documentUri, nodePath));
    }
}
/* c8 ignore stop */
