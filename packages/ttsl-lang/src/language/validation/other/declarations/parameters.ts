import { AstUtils, ValidationAcceptor } from 'langium';
import { isTslCallable, TslParameter } from '../../../generated/ast.js';
import { Parameter } from '../../../helpers/nodeProperties.js';
import { TTSLServices } from '../../../ttsl-module.js';

export const CODE_PARAMETER_CONSTANT_DEFAULT_VALUE = 'parameter/constant-default-value';
export const CODE_PARAMETER_CONSTANT_TYPE = 'parameter/constant-type';

export const constantParameterMustHaveConstantDefaultValue = (services: TTSLServices) => {
    const partialEvaluator = services.evaluation.PartialEvaluator;

    return (node: TslParameter, accept: ValidationAcceptor) => {
        if (!Parameter.isConstant(node) || !node.defaultValue) {
            return;
        }

        if (!partialEvaluator.canBeValueOfConstantParameter(node.defaultValue)) {
            accept('error', `Default values of constant parameters must be constant.`, {
                node,
                property: 'defaultValue',
                code: CODE_PARAMETER_CONSTANT_DEFAULT_VALUE,
            });
        }
    };
};

export const constantParameterMustHaveTypeThatCanBeEvaluatedToConstant = (services: TTSLServices) => {
    const typeChecker = services.types.TypeChecker;
    const typeComputer = services.types.TypeComputer;

    return (node: TslParameter, accept: ValidationAcceptor) => {
        if (!Parameter.isConstant(node) || !node.type) {
            return;
        }

        const type = typeComputer.computeType(node);
        if (!typeChecker.canBeTypeOfConstantParameter(type)) {
            accept('error', `A constant parameter cannot have type '${type.toString()}'.`, {
                node,
                property: 'type',
                code: CODE_PARAMETER_CONSTANT_TYPE,
            });
        }
    };
};
