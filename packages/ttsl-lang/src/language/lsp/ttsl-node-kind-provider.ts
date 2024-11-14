import { AstNode, AstNodeDescription, isAstNode } from 'langium';
import { CompletionItemKind, SymbolKind } from 'vscode-languageserver';
import {
    TslConstant,
    TslData,
    TslFunction,
    TslModule,
    TslParameter,
    TslPlaceholder,
    TslResult,
} from '../generated/ast.js';
import { NodeKindProvider } from 'langium/lsp';

export class TTSLNodeKindProvider implements NodeKindProvider {
    getSymbolKind(nodeOrDescription: AstNode | AstNodeDescription): SymbolKind {
        // The WorkspaceSymbolProvider only passes descriptions, where the node might be undefined
        const type = this.getNodeType(nodeOrDescription);
        switch (type) {
            case TslFunction:
                return SymbolKind.Function;
            case TslConstant:
                return SymbolKind.Constant;
            case TslData:
                return SymbolKind.Property;
            case TslModule:
                return SymbolKind.Package;
            /* c8 ignore next 2 */
            case TslParameter:
                return SymbolKind.Variable;
            /* c8 ignore next 2 */
            case TslPlaceholder:
                return SymbolKind.Variable;
            /* c8 ignore next 2 */
            case TslResult:
                return SymbolKind.Variable;
            /* c8 ignore next 2 */
            default:
                return SymbolKind.Null;
        }
    }

    /* c8 ignore start */
    getCompletionItemKind(_nodeOrDescription: AstNode | AstNodeDescription) {
        return CompletionItemKind.Reference;
    }

    /* c8 ignore stop */

    private getNodeType(nodeOrDescription: AstNode | AstNodeDescription): string {
        if (isAstNode(nodeOrDescription)) {
            return nodeOrDescription.$type;
        } /* c8 ignore start */ else {
            return nodeOrDescription.type;
        } /* c8 ignore stop */
    }
}
