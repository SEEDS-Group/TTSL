import { TslIndexedAccess } from '../../../generated/ast.js';
import { ValidationAcceptor } from 'langium';
import { TTSLServices } from '../../../ttsl-module.js';
import { EvaluatedList, EvaluatedMap, IntConstant } from '../../../partialEvaluation/model.js';
import { ListType } from '../../../typing/model.js';

export const CODE_INDEXED_ACCESS_INVALID_INDEX = 'indexed-access/invalid-index';

export const indexedAccessIndexMustBeValid = (services: TTSLServices) => {
    const partialEvaluator = services.evaluation.PartialEvaluator;
    const typeComputer = services.types.TypeComputer;

    return (node: TslIndexedAccess, accept: ValidationAcceptor): void => {
        const indexValue = partialEvaluator.evaluate(node.index);
        if (!indexValue.isFullyEvaluated) {
            return;
        }

        const receiverValue = partialEvaluator.evaluate(node.receiver);
        // Check map key
        if (receiverValue instanceof EvaluatedMap) {
            if (!receiverValue.has(indexValue)) {
                accept('error', `Dictionary key '${indexValue}' does not exist.`, {
                    node,
                    property: 'index',
                    code: CODE_INDEXED_ACCESS_INVALID_INDEX,
                });
            }
            return;
        }

        // Check list index
        if (!(indexValue instanceof IntConstant)) {
            return;
        }

        if (receiverValue instanceof EvaluatedList) {
            if (indexValue.value < 0 || indexValue.value >= receiverValue.size) {
                accept('error', `List index '${indexValue}' is out of bounds.`, {
                    node,
                    property: 'index',
                    code: CODE_INDEXED_ACCESS_INVALID_INDEX,
                });
            }
        }

        const receiverType = typeComputer.computeType(node.receiver);
        if (receiverType instanceof ListType) {
            if (indexValue.value < 0) {
                accept('error', `List index '${indexValue}' is out of bounds.`, {
                    node,
                    property: 'index',
                    code: CODE_INDEXED_ACCESS_INVALID_INDEX,
                });
            }
        }
    };
};
