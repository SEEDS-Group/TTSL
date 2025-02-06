import { AstNode, DefaultCommentProvider, isAstNodeWithComment } from 'langium';
import { MarkupContent } from 'vscode-languageserver';
import { isTslDeclaration, isTslParameter, isTslPlaceholder, isTslResult } from '../generated/ast.js';

export class TTSLCommentProvider extends DefaultCommentProvider {
    override getComment(node: AstNode): string | undefined {
        /* c8 ignore start */ if (isAstNodeWithComment(node)) {
            return node.$comment;
        } /* c8 ignore stop */ else if (
            !isTslDeclaration(node) ||
            isTslParameter(node) ||
            isTslPlaceholder(node) ||
            isTslResult(node)
        ) {
            return undefined;
        }

        return super.getComment(node);
    }
}

export const createMarkupContent = (documentation: string | undefined): MarkupContent | undefined => {
    if (!documentation) {
        return undefined;
    }

    return {
        kind: 'markdown',
        value: documentation,
    };
};
