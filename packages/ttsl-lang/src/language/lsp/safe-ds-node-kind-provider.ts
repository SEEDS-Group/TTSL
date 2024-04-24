import { AstNode, AstNodeDescription, AstUtils, isAstNode } from 'langium';
import { CompletionItemKind, SymbolKind } from 'vscode-languageserver';
import {
    isTslClass,
    isTslFunction,
    TslAnnotation,
    TslAttribute,
    TslBlockLambdaResult,
    TslClass,
    TslEnum,
    TslEnumVariant,
    TslFunction,
    TslModule,
    TslParameter,
    TslPipeline,
    TslPlaceholder,
    TslResult,
    TslSchema,
    TslSegment,
    TslTypeParameter,
} from '../generated/ast.js';
import { NodeKindProvider } from 'langium/lsp';

export class SafeDsNodeKindProvider implements NodeKindProvider {
    getSymbolKind(nodeOrDescription: AstNode | AstNodeDescription): SymbolKind {
        // The WorkspaceSymbolProvider only passes descriptions, where the node might be undefined
        const node = this.getNode(nodeOrDescription);
        if (isTslFunction(node) && AstUtils.hasContainerOfType(node, isTslClass)) {
            return SymbolKind.Method;
        }

        const type = this.getNodeType(nodeOrDescription);
        switch (type) {
            case TslAnnotation:
                return SymbolKind.Interface;
            case TslAttribute:
                return SymbolKind.Property;
            /* c8 ignore next 2 */
            case TslBlockLambdaResult:
                return SymbolKind.Variable;
            case TslClass:
                return SymbolKind.Class;
            case TslEnum:
                return SymbolKind.Enum;
            case TslEnumVariant:
                return SymbolKind.EnumMember;
            case TslFunction:
                return SymbolKind.Function;
            case TslModule:
                return SymbolKind.Package;
            /* c8 ignore next 2 */
            case TslParameter:
                return SymbolKind.Variable;
            case TslPipeline:
                return SymbolKind.Function;
            /* c8 ignore next 2 */
            case TslPlaceholder:
                return SymbolKind.Variable;
            /* c8 ignore next 2 */
            case TslResult:
                return SymbolKind.Variable;
            case TslSchema:
                return SymbolKind.Struct;
            case TslSegment:
                return SymbolKind.Function;
            /* c8 ignore next 2 */
            case TslTypeParameter:
                return SymbolKind.TypeParameter;
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

    private getNode(nodeOrDescription: AstNode | AstNodeDescription): AstNode | undefined {
        if (isAstNode(nodeOrDescription)) {
            return nodeOrDescription;
        } /* c8 ignore start */ else {
            return nodeOrDescription.node;
        } /* c8 ignore stop */
    }

    private getNodeType(nodeOrDescription: AstNode | AstNodeDescription): string {
        if (isAstNode(nodeOrDescription)) {
            return nodeOrDescription.$type;
        } /* c8 ignore start */ else {
            return nodeOrDescription.type;
        } /* c8 ignore stop */
    }
}
