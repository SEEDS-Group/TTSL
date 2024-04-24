import { isTslArgument, isTslParameter, isTslParenthesizedExpression, TslLambda } from '../../../generated/ast.js';
import { ValidationAcceptor } from 'langium';
import { getParameters } from '../../../helpers/nodeProperties.js';
import { SafeDsServices } from '../../../safe-ds-module.js';

export const CODE_LAMBDA_CONTEXT = 'lambda/context';
export const CODE_LAMBDA_CONST_MODIFIER = 'lambda/const-modifier';

export const lambdaMustBeAssignedToTypedParameter = (services: SafeDsServices) => {
    const nodeMapper = services.helpers.NodeMapper;

    return (node: TslLambda, accept: ValidationAcceptor): void => {
        let context = node.$container;
        while (isTslParenthesizedExpression(context)) {
            context = context.$container;
        }

        let contextIsValid = false;
        if (isTslParameter(context)) {
            contextIsValid = context.type !== undefined;
        } else if (isTslArgument(context)) {
            const parameter = nodeMapper.argumentToParameter(context);
            // If the resolution of the parameter failed, we already show another error nearby
            contextIsValid = parameter === undefined || parameter.type !== undefined;
        }

        if (!contextIsValid) {
            accept('error', 'A lambda must be assigned to a typed parameter.', {
                node,
                code: CODE_LAMBDA_CONTEXT,
            });
        }
    };
};

export const lambdaParameterMustNotHaveConstModifier = (node: TslLambda, accept: ValidationAcceptor): void => {
    for (const parameter of getParameters(node)) {
        if (parameter.isConstant) {
            accept('error', 'The const modifier is not applicable to parameters of lambdas.', {
                node: parameter,
                property: 'isConstant',
                code: CODE_LAMBDA_CONST_MODIFIER,
            });
        }
    }
};
