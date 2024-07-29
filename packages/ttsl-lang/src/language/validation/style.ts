import { ValidationAcceptor } from 'langium';
import { isEmpty } from '../../helpers/collections.js';
import {
    isTslCall,
    isTslIndexedAccess,
    isTslMemberAccess,
    TslCall,
    TslChainedExpression,
    TslFunction,
    TslImportedDeclaration,
    TslInfixOperation,
} from '../generated/ast.js';
import { getParameters} from '../helpers/nodeProperties.js';
import { NullConstant } from '../partialEvaluation/model.js';
import { TTSLServices } from '../ttsl-module.js';
import { UnknownType } from '../typing/model.js';

export const CODE_STYLE_UNNECESSARY_ARGUMENT_LIST = 'style/unnecessary-argument-list';
export const CODE_STYLE_UNNECESSARY_ELVIS_OPERATOR = 'style/unnecessary-elvis-operator';
export const CODE_STYLE_UNNECESSARY_IMPORT_ALIAS = 'style/unnecessary-import-alias';
export const CODE_STYLE_UNNECESSARY_NULL_SAFETY = 'style/unnecessary-null-safety';
export const CODE_STYLE_UNNECESSARY_RESULT_LIST = 'style/unnecessary-result-list';

// -----------------------------------------------------------------------------
// Unnecessary argument lists
// -----------------------------------------------------------------------------

export const callArgumentListShouldBeNeeded = (services: TTSLServices) => {
    const settingsProvider = services.workspace.SettingsProvider;

    return async (node: TslCall, accept: ValidationAcceptor) => {
        if (!(await settingsProvider.shouldValidateCodeStyle())) {
            /* c8 ignore next 2 */
            return;
        }

        const argumentList = node.argumentList;
        if (!argumentList || !isEmpty(argumentList.arguments)) {
            // If there are arguments, they are either needed or erroneous (i.e. we already show an error)
            return;
        }

        const callable = services.helpers.NodeMapper.callToCallable(node);

        if (isEmpty(getParameters(callable))) {
            accept('info', 'This argument list can be removed.', {
                node: argumentList,
                code: CODE_STYLE_UNNECESSARY_ARGUMENT_LIST,
            });
        }
    };
};

// -----------------------------------------------------------------------------
// Unnecessary bodies
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Unnecessary elvis operator
// -----------------------------------------------------------------------------

export const elvisOperatorShouldBeNeeded = (services: TTSLServices) => {
    const partialEvaluator = services.evaluation.PartialEvaluator;
    const settingsProvider = services.workspace.SettingsProvider;
    const typeChecker = services.types.TypeChecker;
    const typeComputer = services.types.TypeComputer;

    return async (node: TslInfixOperation, accept: ValidationAcceptor) => {
        if (!(await settingsProvider.shouldValidateCodeStyle())) {
            /* c8 ignore next 2 */
            return;
        }

        if (node.operator !== '?:') {
            return;
        }

        const leftType = typeComputer.computeType(node.leftOperand);
        if (!typeChecker.canBeNull(leftType)) {
            accept(
                'info',
                'The left operand is never null, so the elvis operator is unnecessary (keep the left operand).',
                {
                    node,
                    code: CODE_STYLE_UNNECESSARY_ELVIS_OPERATOR,
                },
            );
        }

        const leftValue = partialEvaluator.evaluate(node.leftOperand);
        const rightValue = partialEvaluator.evaluate(node.rightOperand);
        if (leftValue === NullConstant && rightValue === NullConstant) {
            accept(
                'info',
                'Both operands are always null, so the elvis operator is unnecessary (replace it with null).',
                {
                    node,
                    code: CODE_STYLE_UNNECESSARY_ELVIS_OPERATOR,
                },
            );
        } else if (leftValue === NullConstant) {
            accept(
                'info',
                'The left operand is always null, so the elvis operator is unnecessary (keep the right operand).',
                {
                    node,
                    code: CODE_STYLE_UNNECESSARY_ELVIS_OPERATOR,
                },
            );
        } else if (rightValue === NullConstant) {
            accept(
                'info',
                'The right operand is always null, so the elvis operator is unnecessary (keep the left operand).',
                {
                    node,
                    code: CODE_STYLE_UNNECESSARY_ELVIS_OPERATOR,
                },
            );
        }
    };
};

// -----------------------------------------------------------------------------
// Unnecessary import alias
// -----------------------------------------------------------------------------

export const importedDeclarationAliasShouldDifferFromDeclarationName = (services: TTSLServices) => {
    const settingsProvider = services.workspace.SettingsProvider;

    return async (node: TslImportedDeclaration, accept: ValidationAcceptor) => {
        if (!(await settingsProvider.shouldValidateCodeStyle())) {
            /* c8 ignore next 2 */
            return;
        }

        if (node.alias && node.alias.alias === node.declaration?.$refText) {
            accept('info', 'This alias can be removed.', {
                node,
                property: 'alias',
                code: CODE_STYLE_UNNECESSARY_IMPORT_ALIAS,
            });
        }
    };
};

// -----------------------------------------------------------------------------
// Unnecessary null safety
// -----------------------------------------------------------------------------

export const chainedExpressionNullSafetyShouldBeNeeded = (services: TTSLServices) => {
    const settingsProvider = services.workspace.SettingsProvider;
    const typeChecker = services.types.TypeChecker;
    const typeComputer = services.types.TypeComputer;

    return async (node: TslChainedExpression, accept: ValidationAcceptor) => {
        if (!(await settingsProvider.shouldValidateCodeStyle())) {
            /* c8 ignore next 2 */
            return;
        }

        if (!node.isNullSafe) {
            return;
        }

        const receiverType = typeComputer.computeType(node.receiver);
        if (receiverType === UnknownType || typeChecker.canBeNull(receiverType)) {
            return;
        }

        if (
            (isTslCall(node)) ||
            (isTslIndexedAccess(node) && typeChecker.canBeAccessedByIndex(receiverType)) ||
            isTslMemberAccess(node)
        ) {
            accept('info', 'The receiver is never null, so null-safety is unnecessary.', {
                node,
                code: CODE_STYLE_UNNECESSARY_NULL_SAFETY,
            });
        }
    };
};

// -----------------------------------------------------------------------------
// Unnecessary result lists
// -----------------------------------------------------------------------------

export const functionResultListShouldNotBeEmpty = (services: TTSLServices) => {
    const settingsProvider = services.workspace.SettingsProvider;

    return async (node: TslFunction, accept: ValidationAcceptor) => {
        if (!(await settingsProvider.shouldValidateCodeStyle())) {
            /* c8 ignore next 2 */
            return;
        }

        if (node.result && node.body.returnValue == undefined) {
            accept('info', 'This result list can be removed.', {
                node,
                property: 'result',
                code: CODE_STYLE_UNNECESSARY_RESULT_LIST,
            });
        }
    };
};