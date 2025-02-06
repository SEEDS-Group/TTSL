import { ValidationAcceptor } from 'langium';
import { type TslCall } from '../../../generated/ast.js';
import { getArguments, Parameter } from '../../../helpers/nodeProperties.js';
import { TTSLServices } from '../../../ttsl-module.js';

export const CODE_CALL_CONSTANT_ARGUMENT = 'call/constant-argument';
export const CODE_CALL_INFINITE_RECURSION = 'call/infinite-recursion';

export const callArgumentMustBeConstantIfParameterIsConstant = (services: TTSLServices) => {
    const nodeMapper = services.helpers.NodeMapper;
    const partialEvaluator = services.evaluation.PartialEvaluator;

    return (node: TslCall, accept: ValidationAcceptor) => {
        for (const argument of getArguments(node)) {
            if (!argument.value) {
                /* c8 ignore next 2 */
                return;
            }

            const parameter = nodeMapper.argumentToParameter(argument);
            if (!Parameter.isConstant(parameter)) {
                return;
            }

            if (!partialEvaluator.canBeValueOfConstantParameter(argument.value)) {
                accept('error', 'Values assigned to constant parameters must be constant.', {
                    node: argument,
                    property: 'value',
                    code: CODE_CALL_CONSTANT_ARGUMENT,
                });
            }
        }
    };
};

export const callMustNotBeRecursive = (services: TTSLServices) => {
    const callGraphComputer = services.flow.CallGraphComputer;

    return (node: TslCall, accept: ValidationAcceptor) => {
        if (callGraphComputer.isRecursive(node)) {
            accept('error', 'Call leads to infinite recursion.', {
                node,
                code: CODE_CALL_INFINITE_RECURSION,
            });
        }
    };
};
