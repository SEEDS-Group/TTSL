import { AstNode } from 'langium';
import { isTslFunction } from '../generated/ast.js';
import type { SafeDsServices } from '../safe-ds-module.js';
import { SafeDsTypeComputer } from '../typing/safe-ds-type-computer.js';

export class SafeDsNodeInfoProvider {
    private readonly typeComputer: SafeDsTypeComputer;

    constructor(services: SafeDsServices) {
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
