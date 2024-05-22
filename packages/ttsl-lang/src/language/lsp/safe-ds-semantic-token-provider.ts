import { AbstractSemanticTokenProvider, SemanticTokenAcceptor } from 'langium/lsp';
import { AstNode, AstUtils } from 'langium';
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver';
import { SafeDsClasses } from '../builtins/safe-ds-classes.js';
import {
    isTslAnnotation,
    isTslAnnotationCall,
    isTslArgument,
    isTslAttribute,
    isTslClass,
    isTslDeclaration,
    isTslEnum,
    isTslEnumVariant,
    isTslFunction,
    isTslImport,
    isTslImportedDeclaration,
    isTslModule,
    isTslNamedType,
    isTslParameter,
    isTslParameterBound,
    isTslPipeline,
    isTslPlaceholder,
    isTslReference,
    isTslResult,
    isTslSchema,
    isTslSegment,
    isTslTypeArgument,
    isTslTypeParameter,
    isTslYield,
} from '../generated/ast.js';
import { SafeDsServices } from '../safe-ds-module.js';

export class SafeDsSemanticTokenProvider extends AbstractSemanticTokenProvider {
    private readonly builtinClasses: SafeDsClasses;

    constructor(services: SafeDsServices) {
        super(services);

        this.builtinClasses = services.builtins.Classes;
    }

    protected highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        if (isTslAnnotationCall(node)) {
            acceptor({
                node,
                keyword: '@',
                type: SemanticTokenTypes.decorator,
            });
            acceptor({
                node,
                property: 'annotation',
                type: SemanticTokenTypes.decorator,
            });
        } else if (isTslArgument(node)) {
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
        } else if (isTslNamedType(node)) {
            const info = this.computeSemanticTokenInfoForDeclaration(node.declaration?.ref);
            if (info) {
                acceptor({
                    node,
                    property: 'declaration',
                    ...info,
                });
            }
        } else if (isTslParameterBound(node)) {
            acceptor({
                node,
                property: 'leftOperand',
                type: SemanticTokenTypes.parameter,
            });
        } else if (isTslReference(node)) {
            const info = this.computeSemanticTokenInfoForDeclaration(node.target.ref);
            if (info) {
                acceptor({
                    node,
                    property: 'target',
                    ...info,
                });
            }
        } else if (isTslTypeArgument(node)) {
            if (node.typeParameter) {
                acceptor({
                    node,
                    property: 'typeParameter',
                    type: SemanticTokenTypes.typeParameter,
                });
            }
        } else if (isTslYield(node)) {
            // For lack of a better option, we use the token type for parameters here
            acceptor({
                node,
                property: 'result',
                type: SemanticTokenTypes.parameter,
            });
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

        if (isTslAnnotation(node)) {
            return {
                type: SemanticTokenTypes.decorator,
                modifier: additionalModifiers,
            };
        } else if (isTslAttribute(node)) {
            const modifier = [SemanticTokenModifiers.readonly, ...additionalModifiers];
            if (node.isStatic) {
                modifier.push(SemanticTokenModifiers.static);
            }

            return {
                type: SemanticTokenTypes.property,
                modifier,
            };
        } else if (isTslClass(node)) {
            const isBuiltinClass = this.builtinClasses.isBuiltinClass(node);
            return {
                type: SemanticTokenTypes.class,
                modifier: isBuiltinClass
                    ? [SemanticTokenModifiers.defaultLibrary, ...additionalModifiers]
                    : additionalModifiers,
            };
        } else if (isTslEnum(node)) {
            return {
                type: SemanticTokenTypes.enum,
                modifier: additionalModifiers,
            };
        } else if (isTslEnumVariant(node)) {
            return {
                type: SemanticTokenTypes.enumMember,
                modifier: additionalModifiers,
            };
        } else if (isTslFunction(node)) {
            if (AstUtils.hasContainerOfType(node, isTslClass)) {
                return {
                    type: SemanticTokenTypes.method,
                    modifier: node.isStatic
                        ? [SemanticTokenModifiers.static, ...additionalModifiers]
                        : additionalModifiers,
                };
            } else {
                return {
                    type: SemanticTokenTypes.function,
                    modifier: additionalModifiers,
                };
            }
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
        } else if (isTslPipeline(node)) {
            return {
                type: SemanticTokenTypes.function,
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
        } else if (isTslSchema(node)) {
            return {
                type: SemanticTokenTypes.type,
                modifier: additionalModifiers,
            };
        } else if (isTslSegment(node)) {
            return {
                type: SemanticTokenTypes.function,
                modifier: additionalModifiers,
            };
        } else if (isTslTypeParameter(node)) {
            return {
                type: SemanticTokenTypes.typeParameter,
                modifier: additionalModifiers,
            };
        }
    }
}

interface SemanticTokenInfo {
    type: SemanticTokenTypes;
    modifier?: SemanticTokenModifiers | SemanticTokenModifiers[];
}
