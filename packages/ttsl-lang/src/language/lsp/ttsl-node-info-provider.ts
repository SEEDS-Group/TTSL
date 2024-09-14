import { AstNode } from 'langium';
import { isTslFunction } from '../generated/ast.js';
import type { TTSLServices } from '../ttsl-module.js';
import { TTSLTypeComputer } from '../typing/ttsl-type-computer.js';

export class TTSLNodeInfoProvider {
    private readonly typeComputer: TTSLTypeComputer;

    constructor(services: TTSLServices) {
        this.typeComputer = services.types.TypeComputer;
    }

    /**
     * Returns the detail string for the given node. This can be used, for example, to provide document symbols or call
     * hierarchies.
     */
    getDetails(node: AstNode): string | undefined {
        if (isTslFunction(node)) {
            return this.typeComputer.computeType(node)?.toString();
        } else {
            return undefined;
        }
    }
}
