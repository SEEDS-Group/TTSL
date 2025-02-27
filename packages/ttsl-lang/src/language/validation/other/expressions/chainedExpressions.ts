import { TTSLServices } from '../../../ttsl-module.js';
import { isTslCall, isTslIndexedAccess, TslChainedExpression } from '../../../generated/ast.js';
import { ValidationAcceptor } from 'langium';
import { UnknownType } from '../../../typing/model.js';

export const CODE_CHAINED_EXPRESSION_MISSING_NULL_SAFETY = 'chained-expression/missing-null-safety';

export const chainedExpressionsMustBeNullSafeIfReceiverIsNullable = (services: TTSLServices) => {
    const typeChecker = services.types.TypeChecker;
    const typeComputer = services.types.TypeComputer;

    return (node: TslChainedExpression, accept: ValidationAcceptor): void => {
        if (node.isNullSafe) {
            return;
        }

        const receiverType = typeComputer.computeType(node.receiver);
        if (receiverType === UnknownType || !typeChecker.canBeNull(receiverType)) {
            return;
        }

        if (isTslCall(node)) {
            accept('error', 'The receiver can be null so a null-safe call must be used.', {
                node,
                code: CODE_CHAINED_EXPRESSION_MISSING_NULL_SAFETY,
            });
        } else if (isTslIndexedAccess(node) && typeChecker.canBeAccessedByIndex(receiverType)) {
            accept('error', 'The receiver can be null so a null-safe indexed access must be used.', {
                node,
                code: CODE_CHAINED_EXPRESSION_MISSING_NULL_SAFETY,
            });
        }
    };
};
