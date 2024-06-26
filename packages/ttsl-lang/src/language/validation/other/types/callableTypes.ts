import { AstUtils, ValidationAcceptor } from 'langium';
import { isTslCallableType, isTslParameter, TslCallableType } from '../../../generated/ast.js';

import { getParameters, Parameter } from '../../../helpers/nodeProperties.js';

export const CODE_CALLABLE_TYPE_CONST_MODIFIER = 'callable-type/const-modifier';
export const CODE_CALLABLE_TYPE_CONTEXT = 'callable-type/context';
export const CODE_CALLABLE_TYPE_NO_OPTIONAL_PARAMETERS = 'callable-type/no-optional-parameters';

export const callableTypeParameterMustNotHaveConstModifier = (
    node: TslCallableType,
    accept: ValidationAcceptor,
): void => {
    for (const parameter of getParameters(node)) {
        if (parameter.isConstant) {
            accept('error', 'The const modifier is not applicable to parameters of callable types.', {
                node: parameter,
                property: 'isConstant',
                code: CODE_CALLABLE_TYPE_CONST_MODIFIER,
            });
        }
    }
};

export const callableTypeMustBeUsedInCorrectContext = (node: TslCallableType, accept: ValidationAcceptor): void => {
    if (!contextIsCorrect(node)) {
        accept('error', 'Callable types must only be used for parameters.', {
            node,
            code: CODE_CALLABLE_TYPE_CONTEXT,
        });
    }
};

const contextIsCorrect = (node: TslCallableType): boolean => {
    if (isTslParameter(node.$container)) {
        return true;
    }

    // Check whether we already show an error on a containing callable type
    let containingCallableType = AstUtils.getContainerOfType(node.$container, isTslCallableType);
    while (containingCallableType) {
        if (!isTslParameter(containingCallableType.$container)) {
            return true; // Container already has wrong context
        }
        containingCallableType = AstUtils.getContainerOfType(containingCallableType.$container, isTslCallableType);
    }

    return false;
};

export const callableTypeMustNotHaveOptionalParameters = (node: TslCallableType, accept: ValidationAcceptor): void => {
    for (const parameter of getParameters(node)) {
        if (Parameter.isOptional(parameter)) {
            accept('error', 'A callable type must not have optional parameters.', {
                node: parameter,
                property: 'defaultValue',
                code: CODE_CALLABLE_TYPE_NO_OPTIONAL_PARAMETERS,
            });
        }
    }
};
