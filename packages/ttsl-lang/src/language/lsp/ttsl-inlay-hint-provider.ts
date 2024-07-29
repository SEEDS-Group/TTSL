import { AstNode, DocumentationProvider } from 'langium';
import { InlayHintKind, MarkupContent } from 'vscode-languageserver';
import { createMarkupContent } from '../documentation/ttsl-comment-provider.js';
import { isTslArgument, isTslPlaceholder } from '../generated/ast.js';
import { Argument } from '../helpers/nodeProperties.js';
import { TTSLNodeMapper } from '../helpers/ttsl-node-mapper.js';
import { TTSLServices } from '../ttsl-module.js';
import { TTSLTypeComputer } from '../typing/ttsl-type-computer.js';
import { AbstractInlayHintProvider, InlayHintAcceptor } from 'langium/lsp';

export class TTSLInlayHintProvider extends AbstractInlayHintProvider {
    private readonly documentationProvider: DocumentationProvider;
    private readonly nodeMapper: TTSLNodeMapper;
    private readonly typeComputer: TTSLTypeComputer;

    constructor(services: TTSLServices) {
        super();

        this.documentationProvider = services.documentation.DocumentationProvider;
        this.nodeMapper = services.helpers.NodeMapper;
        this.typeComputer = services.types.TypeComputer;
    }

    override computeInlayHint(node: AstNode, acceptor: InlayHintAcceptor) {
        const cstNode = node.$cstNode;
        /* c8 ignore start */
        if (!cstNode) {
            return;
        }
        /* c8 ignore stop */

        if (isTslArgument(node) && Argument.isPositional(node)) {
            const parameter = this.nodeMapper.argumentToParameter(node);
            if (parameter) {
                acceptor({
                    position: cstNode.range.start,
                    label: `${parameter.name} = `,
                    kind: InlayHintKind.Parameter,
                    tooltip: createMarkupContent(this.documentationProvider.getDocumentation(parameter)),
                });
            }
        } else if (isTslPlaceholder(node)) {
            const type = this.typeComputer.computeType(node);
            let tooltip: MarkupContent | undefined = undefined;
            
            acceptor({
                position: cstNode.range.end,
                label: `: ${type}`,
                kind: InlayHintKind.Type,
                tooltip,
            });
        }
    }
}
