import { SafeDsServices } from '../../../safe-ds-module.js';
import {
    isTslCallable,
    isTslComparisonOperator,
    type TslCall,
    TslParameter,
} from '../../../generated/ast.js';
import { AstUtils, ValidationAcceptor } from 'langium';
import { getArguments, getParameters, Parameter } from '../../../helpers/nodeProperties.js';
import { Constant, EvaluatedNode, FloatConstant, IntConstant } from '../../../partialEvaluation/model.js';

export const CODE_PARAMETER_BOUND_INVALID_VALUE = 'parameter-bound/invalid-value';
export const CODE_PARAMETER_BOUND_PARAMETER = 'parameter-bound/parameter';
export const CODE_PARAMETER_BOUND_RIGHT_OPERAND = 'parameter-bound/right-operand';

export const callArgumentMustRespectParameterBounds = (services: SafeDsServices) => {
    const nodeMapper = services.helpers.NodeMapper;
    const partialEvaluator = services.evaluation.PartialEvaluator;

    return (node: TslCall, accept: ValidationAcceptor) => {
        const substitutions = partialEvaluator.computeParameterSubstitutionsForCall(node);

        for (const argument of getArguments(node)) {
            const value = partialEvaluator.evaluate(argument.value);
            if (!(value instanceof Constant)) {
                continue;
            }

            const parameter = nodeMapper.argumentToParameter(argument);
            if (!parameter) {
                continue;
            }

            for (const bound of Parameter.getBounds(parameter)) {
                const rightOperand = partialEvaluator.evaluate(bound.rightOperand, substitutions);
                const errorMessage = checkBound(parameter.name, value, bound.operator, rightOperand);

                if (errorMessage) {
                    accept('error', errorMessage, {
                        node: argument,
                        property: 'value',
                        code: CODE_PARAMETER_BOUND_INVALID_VALUE,
                    });
                }
            }
        }
    };
};

export const parameterDefaultValueMustRespectParameterBounds = (services: SafeDsServices) => {
    const partialEvaluator = services.evaluation.PartialEvaluator;

    return (node: TslParameter, accept: ValidationAcceptor) => {
        if (!node.defaultValue) {
            return;
        }

        const value = partialEvaluator.evaluate(node.defaultValue);
        if (!(value instanceof Constant)) {
            return;
        }

        // Error if we cannot verify some bounds
        for (const bound of Parameter.getBounds(node)) {
            const rightOperand = partialEvaluator.evaluate(bound.rightOperand);
            if (!(rightOperand instanceof Constant)) {
                accept('error', 'Cannot verify whether the parameter bounds are always met.', {
                    node,
                    property: 'defaultValue',
                    code: CODE_PARAMETER_BOUND_INVALID_VALUE,
                });
                return;
            }
        }

        // Error if the default value violates some bounds
        for (const bound of Parameter.getBounds(node)) {
            const rightOperand = partialEvaluator.evaluate(bound.rightOperand);
            const errorMessage = checkBound(node.name, value, bound.operator, rightOperand);
            if (errorMessage) {
                accept('error', errorMessage, {
                    node,
                    property: 'defaultValue',
                    code: CODE_PARAMETER_BOUND_INVALID_VALUE,
                });
            }
        }
    };
};

const checkBound = (
    parameterName: string,
    leftOperand: EvaluatedNode,
    operator: string,
    rightOperand: EvaluatedNode,
): string | undefined => {
    // Arguments must be valid
    if (
        (!(leftOperand instanceof FloatConstant) && !(leftOperand instanceof IntConstant)) ||
        !isTslComparisonOperator(operator) ||
        (!(rightOperand instanceof FloatConstant) && !(rightOperand instanceof IntConstant))
    ) {
        return;
    }

    const createMessage = (relation: string) => {
        return `The value of '${parameterName}' must be ${relation} ${rightOperand.toString()} but was ${leftOperand.toString()}.`;
    };

    if (operator === '<') {
        if (leftOperand.value >= rightOperand.value) {
            return createMessage('less than');
        }
    } else if (operator === '<=') {
        if (leftOperand.value > rightOperand.value) {
            return createMessage('less than or equal to');
        }
    } else if (operator === '>=') {
        if (leftOperand.value < rightOperand.value) {
            return createMessage('greater than or equal to');
        }
    } else if (operator === '>') {
        if (leftOperand.value <= rightOperand.value) {
            return createMessage('greater than');
        }
    }

    return undefined;
};