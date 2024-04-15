import {
    AstNode,
    AstUtils,
    isJSDoc,
    JSDocComment,
    JSDocDocumentationProvider,
    JSDocRenderOptions,
    type JSDocTag,
    parseJSDoc,
} from 'langium';
import {
    isTslCallable,
    isTslParameter,
    isTslResult,
    isTslTypeParameter,
    TslParameter,
    TslResult,
    TslTypeParameter,
} from '../generated/ast.js';

const PARAM_TAG = 'param';
const RESULT_TAG = 'result';
const TYPE_PARAM_TAG = 'typeParam';

export class SafeDsDocumentationProvider extends JSDocDocumentationProvider {
    override getDocumentation(node: AstNode): string | undefined {
        if (isTslParameter(node) || isTslResult(node) || isTslTypeParameter(node)) {
            const containingCallable = AstUtils.getContainerOfType(node, isTslCallable);
            /* c8 ignore start */
            if (!containingCallable) {
                return undefined;
            }
            /* c8 ignore stop */

            const comment = this.getJSDocComment(containingCallable);
            if (!comment) {
                return undefined;
            }

            return this.getMatchingTagContent(comment, node);
        } else {
            const comment = this.getJSDocComment(node);
            return comment?.toMarkdown(this.createJSDocRenderOptions(node));
        }
    }

    protected override documentationTagRenderer(node: AstNode, tag: JSDocTag): string | undefined {
        if (tag.name === PARAM_TAG || tag.name === RESULT_TAG || tag.name === TYPE_PARAM_TAG) {
            const contentMd = tag.content.toMarkdown();
            const [paramName, description] = contentMd.split(/\s(.*)/su);
            return `**@${tag.name}** *${paramName}* — ${(description ?? '').trim()}`;
        } else {
            return super.documentationTagRenderer(node, tag);
        }
    }

    private getJSDocComment(node: AstNode): JSDocComment | undefined {
        const comment = this.commentProvider.getComment(node);
        if (comment && isJSDoc(comment)) {
            return parseJSDoc(comment);
        }
        return undefined;
    }

    private getMatchingTagContent(
        comment: JSDocComment,
        node: TslParameter | TslResult | TslTypeParameter,
    ): string | undefined {
        const name = node.name;
        /* c8 ignore start */
        if (!name) {
            return undefined;
        }
        /* c8 ignore stop */

        const tagName = this.getTagName(node);
        const matchRegex = new RegExp(`^${name}\\s+(?<content>.*)`, 'u');

        return comment
            .getTags(tagName)
            .map((it) => it.content.toMarkdown(this.createJSDocRenderOptions(node)))
            .find((it) => matchRegex.test(it))
            ?.match(matchRegex)?.groups?.content;
    }

    private getTagName(node: TslParameter | TslResult | TslTypeParameter): string {
        if (isTslParameter(node)) {
            return PARAM_TAG;
        } else if (isTslResult(node)) {
            return RESULT_TAG;
        } else {
            return TYPE_PARAM_TAG;
        }
    }

    private createJSDocRenderOptions(node: AstNode): JSDocRenderOptions {
        return {
            renderLink: (link, display) => {
                return this.documentationLinkRenderer(node, link, display);
            },
            tag: 'bold',
            renderTag: (tag: JSDocTag) => {
                return this.documentationTagRenderer(node, tag);
            },
        };
    }
}
