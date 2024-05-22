import { AstNode } from 'langium';
import { SymbolTag } from 'vscode-languageserver';
import type { SafeDsAnnotations } from '../builtins/safe-ds-annotations.js';
import { isTslAnnotatedObject, isTslAttribute, isTslFunction, isTslSegment } from '../generated/ast.js';
import type { SafeDsServices } from '../safe-ds-module.js';
import { SafeDsTypeComputer } from '../typing/safe-ds-type-computer.js';

export class SafeDsNodeInfoProvider {
    private readonly builtinAnnotations: SafeDsAnnotations;
    private readonly typeComputer: SafeDsTypeComputer;

    constructor(services: SafeDsServices) {
        this.builtinAnnotations = services.builtins.Annotations;
        this.typeComputer = services.types.TypeComputer;
    }

    /**
     * Returns the detail string for the given node. This can be used, for example, to provide document symbols or call
     * hierarchies.
     */
    getDetails(node: AstNode): string | undefined {
        if (isTslAttribute(node)) {
            return `: ${this.typeComputer.computeType(node)}`;
        } else if (isTslFunction(node) || isTslSegment(node)) {
            return this.typeComputer.computeType(node)?.toString();
        } else {
            return undefined;
        }
    }

    /**
     * Returns the tags for the given node. This can be used, for example, to provide document symbols or call
     * hierarchies.
     */
    getTags(node: AstNode): SymbolTag[] | undefined {
        if (isTslAnnotatedObject(node) && this.builtinAnnotations.callsDeprecated(node)) {
            return [SymbolTag.Deprecated];
        } else {
            return undefined;
        }
    }
}
