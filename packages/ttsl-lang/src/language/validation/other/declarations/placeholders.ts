import { isTslAssignment, isTslBlock, isTslReference, isTslStatement, TslPlaceholder } from '../../../generated/ast.js';
import { AstUtils, ValidationAcceptor } from 'langium';
import { TTSLServices } from '../../../ttsl-module.js';
import { getStatements } from '../../../helpers/nodeProperties.js';
import { DiagnosticTag } from 'vscode-languageserver';
import { last } from '../../../../helpers/collections.js';

export const CODE_PLACEHOLDER_UNUSED = 'placeholder/unused';

export const placeholdersMustNotBeAnAlias = (node: TslPlaceholder): void => {
    if (node.$containerIndex ?? 0 > 0) {
        return;
    }

    const containingAssignment = AstUtils.getContainerOfType(node, isTslAssignment);
    const rhs = containingAssignment?.expression;
    if (!isTslReference(rhs)) {
        return;
    }
};

export const placeholderShouldBeUsed =
    (services: TTSLServices) => (node: TslPlaceholder, accept: ValidationAcceptor) => {
        const usages = services.helpers.NodeMapper.placeholderToReferences(node);
        if (!usages.isEmpty()) {
            return;
        }

        // Don't show a warning if the placeholder is declared in the last statement in the block
        const containingStatement = AstUtils.getContainerOfType(node, isTslStatement);
        const containingBlock = AstUtils.getContainerOfType(containingStatement, isTslBlock);
        const allStatementsInBlock = getStatements(containingBlock);
        if (last(allStatementsInBlock) === containingStatement) {
            return;
        }

        accept('warning', 'This placeholder is unused and can be removed.', {
            node,
            property: 'name',
            code: CODE_PLACEHOLDER_UNUSED,
            tags: [DiagnosticTag.Unnecessary],
        });
    };
