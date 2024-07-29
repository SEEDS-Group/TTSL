import { AbstractSemanticTokenProvider, SemanticTokenAcceptor } from 'langium/lsp';
import { AstNode, AstUtils } from 'langium';
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver';
import {
    isTslArgument,
    isTslDeclaration,
    isTslFunction,
    isTslImport,
    isTslImportedDeclaration,
    isTslModule,
    isTslParameter,
    isTslPlaceholder,
    isTslReference,
    isTslResult,
} from '../generated/ast.js';
import { TTSLServices } from '../ttsl-module.js';

export class TTSLSemanticTokenProvider extends AbstractSemanticTokenProvider {
    constructor(services: TTSLServices) {
        super(services);
    }

    protected highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        if (isTslArgument(node)) {
            if (node.parameter) {
                acceptor({
                    node,
                    property: 'parameter',
                    type: SemanticTokenTypes.parameter,
                });
            }
        } else if (isTslDeclaration(node)) {
            const info = this.computeSemanticTokenInfoForDeclaration(node, [SemanticTokenModifiers.declaration]);
            if (info) {
                acceptor({
                    node,
                    property: 'name',
                    ...info,
                });
            }
        } else if (isTslImport(node)) {
            acceptor({
                node,
                property: 'package',
                type: SemanticTokenTypes.namespace,
            });
        } else if (isTslImportedDeclaration(node)) {
            const info = this.computeSemanticTokenInfoForDeclaration(node.declaration?.ref);
            if (info) {
                acceptor({
                    node,
                    property: 'declaration',
                    ...info,
                });
            }
        } else if (isTslReference(node)) {
            const info = this.computeSemanticTokenInfoForDeclaration(node.target.ref);
            if (info) {
                acceptor({
                    node,
                    property: 'target',
                    ...info,
                });
            }
        }
    }

    private computeSemanticTokenInfoForDeclaration(
        node: AstNode | undefined,
        additionalModifiers: SemanticTokenModifiers[] = [],
    ): SemanticTokenInfo | void {
        /* c8 ignore start */
        if (!node) {
            return;
        }
        /* c8 ignore stop */

        if (isTslFunction(node)) {
            return {
                type: SemanticTokenTypes.function,
                modifier: additionalModifiers,
            };
        } else if (isTslModule(node)) {
            return {
                type: SemanticTokenTypes.namespace,
                modifier: additionalModifiers,
            };
        } else if (isTslParameter(node)) {
            return {
                type: SemanticTokenTypes.parameter,
                modifier: additionalModifiers,
            };
        } else if (isTslPlaceholder(node)) {
            return {
                type: SemanticTokenTypes.variable,
                modifier: [SemanticTokenModifiers.readonly, ...additionalModifiers],
            };
        } else if (isTslResult(node)) {
            return {
                // For lack of a better option, we use the token type for parameters here
                type: SemanticTokenTypes.parameter,
                modifier: additionalModifiers,
            };
        }
    }
}

interface SemanticTokenInfo {
    type: SemanticTokenTypes;
    modifier?: SemanticTokenModifiers | SemanticTokenModifiers[];
}
