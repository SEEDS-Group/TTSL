import { type AstNode, type LangiumDocument } from 'langium';
import type { DocumentSymbol } from 'vscode-languageserver';
import {
    isTslAnnotation,
    isTslAttribute,
    isTslClass,
    isTslEnumVariant,
    isTslFunction,
    isTslPipeline,
    isTslSegment,
} from '../generated/ast.js';
import type { SafeDsServices } from '../safe-ds-module.js';
import type { SafeDsNodeInfoProvider } from './safe-ds-node-info-provider.js';
import { DefaultDocumentSymbolProvider } from 'langium/lsp';

export class SafeDsDocumentSymbolProvider extends DefaultDocumentSymbolProvider {
    private readonly nodeInfoProvider: SafeDsNodeInfoProvider;

    constructor(services: SafeDsServices) {
        super(services);

        this.nodeInfoProvider = services.lsp.NodeInfoProvider;
    }

    protected override getSymbol(document: LangiumDocument, node: AstNode): DocumentSymbol[] {
        const cstNode = node.$cstNode;
        const nameNode = this.nameProvider.getNameNode(node);
        if (nameNode && cstNode) {
            const name = this.nameProvider.getName(node);
            return [
                {
                    name: name ?? nameNode.text,
                    kind: this.nodeKindProvider.getSymbolKind(node),
                    tags: this.nodeInfoProvider.getTags(node),
                    detail: this.nodeInfoProvider.getDetails(node),
                    range: cstNode.range,
                    selectionRange: nameNode.range,
                    children: this.getChildSymbols(document, node),
                },
            ];
        } else {
            return this.getChildSymbols(document, node) || [];
        }
    }

    protected override getChildSymbols(document: LangiumDocument, node: AstNode): DocumentSymbol[] | undefined {
        if (this.isLeaf(node)) {
            return undefined;
        } else if (isTslClass(node)) {
            if (node.body) {
                return super.getChildSymbols(document, node.body);
            } else {
                return undefined;
            }
        } else {
            return super.getChildSymbols(document, node);
        }
    }

    private isLeaf(node: AstNode): boolean {
        return (
            isTslAnnotation(node) ||
            isTslAttribute(node) ||
            isTslEnumVariant(node) ||
            isTslFunction(node) ||
            isTslPipeline(node) ||
            isTslSegment(node)
        );
    }
}
