import { AstUtils, EMPTY_STREAM, Stream } from 'langium';
import {
    isTslAbstractCall,
    isTslAssignment,
    isTslBlock,
    isTslCall,
    isTslCallable,
    isTslFunction,
    isTslParameter,
    isTslReference,
    TslAbstractCall,
    TslArgument,
    TslAssignee,
    TslCallable,
    TslExpression,
    TslParameter,
    TslPlaceholder,
    TslReference,
    TslResult,
} from '../generated/ast.js';
import { TTSLServices } from '../ttsl-module.js';
import { TTSLTypeComputer } from '../typing/ttsl-type-computer.js';
import { Argument, getArguments, getParameters, getResults } from './nodeProperties.js';

export class TTSLNodeMapper {
    private readonly typeComputer: () => TTSLTypeComputer;

    constructor(services: TTSLServices) {
        this.typeComputer = () => services.types.TypeComputer;
    }

    /**
     * Returns the parameter that the argument is assigned to. If there is no matching parameter, returns `undefined`.
     */
    argumentToParameter(node: TslArgument | undefined): TslParameter | undefined {
        if (!node) {
            return undefined;
        }

        // Named argument
        if (node.parameter) {
            return node.parameter.ref;
        }

        // Positional argument
        const containingAbstractCall = AstUtils.getContainerOfType(node, isTslAbstractCall)!;
        const args = getArguments(containingAbstractCall);
        const argumentPosition = node.$containerIndex ?? -1;

        // A prior argument is named
        for (let i = 0; i < argumentPosition; i++) {
            if (Argument.isNamed(args[i]!)) {
                return undefined;
            }
        }

        // Find parameter at the same position
        const callable = this.callToCallable(containingAbstractCall);
        const parameters = getParameters(callable);
        if (argumentPosition < parameters.length) {
            return parameters[argumentPosition];
        }

        return undefined;
    }

    /**
     * Returns the result, block lambda result, or expression that is assigned to the given assignee. If nothing is
     * assigned, `undefined` is returned.
     */
    assigneeToAssignedObject(node: TslAssignee | undefined): TslResult | TslExpression | undefined {
        if (!node) {
            return undefined;
        }

        const containingAssignment = AstUtils.getContainerOfType(node, isTslAssignment);
        /* c8 ignore start */
        if (!containingAssignment) {
            return undefined;
        }
        /* c8 ignore stop */

        const assigneePosition = node.$containerIndex ?? -1;
        const expression = containingAssignment.expression;

        // If the RHS is not a call, the first assignee gets the entire RHS
        if (!isTslFunction(expression)) {
            if (assigneePosition === 0) {
                return expression;
            } else {
                return undefined;
            }
        }

        // Otherwise, the assignee gets the result at the same position
        const abstractResults = getResults(expression);
        return abstractResults[assigneePosition];
    }

    /**
     * Returns the callable that is called by the given call. If no callable can be found, returns `undefined`.
     */
    callToCallable(node: TslAbstractCall | undefined): TslCallable | undefined {
        if (!node) {
            return undefined;
        }

        if (isTslCall(node)) {
            // We ignore nullability, since calls can be made null-safe. For scoping, for instance, we still want to
            // link the arguments of the call properly, even if the user forgot to make the call null-safe. In this
            // case, an error is being shown anyway.

            if (isTslReference(node.receiver)) {
                if (isTslCallable(node.receiver.target.ref)) {
                    return node.receiver.target.ref;
                }
            }
        }

        return undefined;
    }

    /**
     * Returns the value that is assigned to the given parameter in the given call. This can be either the argument
     * value, or the parameter's default value if no argument is provided. If no value can be found, returns
     * `undefined`.
     *
     * @param call The call whose parameter value to return.
     * @param parameter The parameter whose value to return. Can be either a parameter itself or its name.
     */
    callToParameterValue(
        call: TslAbstractCall | undefined,
        parameter: TslParameter | string | undefined,
    ): TslExpression | undefined {
        if (!call || !parameter) {
            return undefined;
        }

        // Parameter is set explicitly
        const argument = getArguments(call).find((it) => {
            if (isTslParameter(parameter)) {
                return this.argumentToParameter(it) === parameter;
            } else {
                return this.argumentToParameter(it)?.name === parameter;
            }
        });
        if (argument) {
            return argument.value;
        }

        // Parameter is not set but might have a default value
        // We must ensure the parameter belongs to the called callable, so we cannot directly get the defaultValue
        const callable = this.callToCallable(call);
        return getParameters(callable).find((it) => {
            if (isTslParameter(parameter)) {
                return it === parameter;
            } else {
                return it.name === parameter;
            }
        })?.defaultValue;
    }

    /**
     * Create a mapping from parameters to arguments. Parameters that are not mapped to an argument are not included in
     * the result. Neither are arguments that are not mapped to a parameter. If multiple arguments are mapped to the
     * same parameter, the first one wins.
     *
     * @param parameters The parameters to map to arguments.
     * @param args The arguments.
     */
    parametersToArguments(parameters: TslParameter[], args: TslArgument[]): Map<TslParameter, TslArgument> {
        const result = new Map<TslParameter, TslArgument>();

        for (const argument of args) {
            const parameterIndex = this.argumentToParameter(argument)?.$containerIndex ?? -1;
            if (parameterIndex === -1) {
                continue;
            }

            /*
             * argumentToParameter returns parameters of callable types. We have to remap this to parameter of the
             * actual callable.
             */
            const parameter = parameters[parameterIndex];
            if (!parameter) {
                continue;
            }

            // The first occurrence wins
            if (!result.has(parameter)) {
                result.set(parameter, argument);
            }
        }

        return result;
    }

    /**
     * Returns all references that target the given parameter.
     */
    parameterToReferences(node: TslParameter | undefined): Stream<TslReference> {
        if (!node) {
            return EMPTY_STREAM;
        }

        const containingCallable = AstUtils.getContainerOfType(node, isTslCallable);
        /* c8 ignore start */
        if (!containingCallable) {
            return EMPTY_STREAM;
        }
        /* c8 ignore stop */

        return AstUtils.findLocalReferences(node, containingCallable)
            .map((it) => it.$refNode?.astNode)
            .filter(isTslReference);
    }

    /**
     * Returns all references that target the given placeholder.
     */
    placeholderToReferences(node: TslPlaceholder | undefined): Stream<TslReference> {
        if (!node) {
            return EMPTY_STREAM;
        }

        const containingBlock = AstUtils.getContainerOfType(node, isTslBlock);
        /* c8 ignore start */
        if (!containingBlock) {
            return EMPTY_STREAM;
        }
        /* c8 ignore stop */

        return AstUtils.findLocalReferences(node, containingBlock)
            .map((it) => it.$refNode?.astNode)
            .filter(isTslReference);
    }
}
