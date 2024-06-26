import { AstUtils, ValidationAcceptor } from 'langium';
import { duplicatesBy, isEmpty } from '../../../helpers/collections.js';
import { pluralize } from '../../../helpers/strings.js';
import { isTslAnnotation, isTslCall, TslAbstractCall, TslArgumentList } from '../../generated/ast.js';
import { getArguments, getParameters, Parameter } from '../../helpers/nodeProperties.js';
import { SafeDsServices } from '../../safe-ds-module.js';

export const CODE_ARGUMENT_LIST_DUPLICATE_PARAMETER = 'argument-list/duplicate-parameter';
export const CODE_ARGUMENT_LIST_MISSING_REQUIRED_PARAMETER = 'argument-list/missing-required-parameter';
export const CODE_ARGUMENT_LIST_POSITIONAL_AFTER_NAMED = 'argument-list/positional-after-named';
export const CODE_ARGUMENT_LIST_TOO_MANY_ARGUMENTS = 'argument-list/too-many-arguments';

export const argumentListMustNotHavePositionalArgumentsAfterNamedArguments = (
    node: TslArgumentList,
    accept: ValidationAcceptor,
): void => {
    let foundNamed = false;
    for (const argument of node.arguments) {
        if (argument.parameter) {
            foundNamed = true;
        } else if (foundNamed) {
            accept('error', 'After the first named argument all arguments must be named.', {
                node: argument,
                code: CODE_ARGUMENT_LIST_POSITIONAL_AFTER_NAMED,
            });
        }
    }
};

export const argumentListMustNotHaveTooManyArguments = (services: SafeDsServices) => {
    const nodeMapper = services.helpers.NodeMapper;

    return (node: TslAbstractCall, accept: ValidationAcceptor): void => {
        const actualArgumentCount = getArguments(node).length;

        // We can never have too many arguments in this case
        if (actualArgumentCount === 0) {
            return;
        }

        // We already report other errors in those cases
        const callable = nodeMapper.callToCallable(node);
        if (!callable || (isTslCall(node) && isTslAnnotation(callable))) {
            return;
        }

        const parameters = getParameters(callable);
        const maxArgumentCount = parameters.length;

        // All is good
        if (actualArgumentCount <= maxArgumentCount) {
            return;
        }

        const minArgumentCount = parameters.filter(Parameter.isRequired).length;
        const kind = pluralize(Math.max(minArgumentCount, maxArgumentCount), 'argument');
        if (minArgumentCount === maxArgumentCount) {
            accept('error', `Expected exactly ${minArgumentCount} ${kind} but got ${actualArgumentCount}.`, {
                node,
                property: 'argumentList',
                code: CODE_ARGUMENT_LIST_TOO_MANY_ARGUMENTS,
            });
        } else {
            accept(
                'error',
                `Expected between ${minArgumentCount} and ${maxArgumentCount} ${kind} but got ${actualArgumentCount}.`,
                {
                    node,
                    property: 'argumentList',
                    code: CODE_ARGUMENT_LIST_TOO_MANY_ARGUMENTS,
                },
            );
        }
    };
};

export const argumentListMustNotSetParameterMultipleTimes = (services: SafeDsServices) => {
    const nodeMapper = services.helpers.NodeMapper;
    const argumentToParameterOrUndefined = nodeMapper.argumentToParameter.bind(nodeMapper);

    return (node: TslArgumentList, accept: ValidationAcceptor): void => {
        // We already report other errors in this case
        const containingCall = AstUtils.getContainerOfType(node, isTslCall);
        const callable = nodeMapper.callToCallable(containingCall);
        if (isTslAnnotation(callable)) {
            return;
        }

        const args = getArguments(node);
        const duplicates = duplicatesBy(args, argumentToParameterOrUndefined);

        for (const duplicate of duplicates) {
            const correspondingParameter = argumentToParameterOrUndefined(duplicate)!;
            accept('error', `The parameter '${correspondingParameter.name}' is already set.`, {
                node: duplicate,
                code: CODE_ARGUMENT_LIST_DUPLICATE_PARAMETER,
            });
        }
    };
};

export const argumentListMustSetAllRequiredParameters = (services: SafeDsServices) => {
    const nodeMapper = services.helpers.NodeMapper;

    return (node: TslAbstractCall, accept: ValidationAcceptor): void => {
        // We already report other errors in this case
        if (!node.argumentList) {
            return;
        }

        // We already report other errors in those cases
        const callable = nodeMapper.callToCallable(node);
        if (!callable || (isTslCall(node) && isTslAnnotation(callable))) {
            return;
        }

        const expectedParameters = getParameters(callable).filter(Parameter.isRequired);
        if (isEmpty(expectedParameters)) {
            return;
        }

        const actualParameters = getArguments(node).map((it) => nodeMapper.argumentToParameter(it));

        const missingTypeParameters = expectedParameters.filter((it) => !actualParameters.includes(it));
        if (!isEmpty(missingTypeParameters)) {
            const kind = pluralize(missingTypeParameters.length, 'parameter');
            const missingParametersString = missingTypeParameters.map((it) => `'${it.name}'`).join(', ');

            accept('error', `The ${kind} ${missingParametersString} must be set here.`, {
                node,
                property: 'argumentList',
                code: CODE_ARGUMENT_LIST_MISSING_REQUIRED_PARAMETER,
            });
        }
    };
};
