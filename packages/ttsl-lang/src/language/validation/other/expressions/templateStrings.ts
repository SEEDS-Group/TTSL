import { isTslTemplateStringPart, TslTemplateString } from '../../../generated/ast.js';
import { ValidationAcceptor } from 'langium';

export const CODE_TEMPLATE_STRING_MISSING_TEMPLATE_EXPRESSION = 'template-string/missing-template-expression';

export const templateStringMustHaveExpressionBetweenTwoStringParts = (
    node: TslTemplateString,
    accept: ValidationAcceptor,
): void => {
    for (let i = 0; i < node.expressions.length - 1; i++) {
        const first = node.expressions[i];
        const second = node.expressions[i + 1];

        if (isTslTemplateStringPart(first) && isTslTemplateStringPart(second)) {
            accept('error', 'There must be an expression between two string parts.', {
                node: second,
                code: CODE_TEMPLATE_STRING_MISSING_TEMPLATE_EXPRESSION,
            });
        }
    }
};
