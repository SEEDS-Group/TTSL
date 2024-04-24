import { AstUtils, EMPTY_STREAM, Stream } from 'langium';
import {
    isTslAbstractCall,
    isTslAnnotationCall,
    isTslAssignment,
    isTslBlock,
    isTslCall,
    isTslCallable,
    isTslClass,
    isTslEnumVariant,
    isTslExpressionLambda,
    isTslNamedType,
    isTslParameter,
    isTslReference,
    isTslSegment,
    isTslType,
    isTslYield,
    TslAbstractCall,
    TslAbstractResult,
    TslArgument,
    TslAssignee,
    TslCallable,
    TslExpression,
    TslParameter,
    TslPlaceholder,
    TslReference,
    TslResult,
    TslTypeArgument,
    TslTypeParameter,
    TslYield,
} from '../generated/ast.js';
import { SafeDsServices } from '../safe-ds-module.js';
import { CallableType, StaticType } from '../typing/model.js';
import { SafeDsTypeComputer } from '../typing/safe-ds-type-computer.js';
import {
    Argument,
    getAbstractResults,
    getArguments,
    getParameters,
    getTypeArguments,
    getTypeParameters,
    TypeArgument,
} from './nodeProperties.js';

export class SafeDsNodeMapper {
    private readonly typeComputer: () => SafeDsTypeComputer;

    constructor(services: SafeDsServices) {
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
    assigneeToAssignedObject(node: TslAssignee | undefined): TslAbstractResult | TslExpression | undefined {
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
        if (!isTslCall(expression)) {
            if (assigneePosition === 0) {
                return expression;
            } else {
                return undefined;
            }
        }

        // If the RHS instantiates a class or enum variant, the first assignee gets the entire RHS
        const callable = this.callToCallable(expression);
        if (isTslClass(callable) || isTslEnumVariant(callable)) {
            if (assigneePosition === 0) {
                return expression;
            } else {
                return undefined;
            }
        }

        // If the RHS calls an expression lambda, the first assignee gets its result
        if (isTslExpressionLambda(callable)) {
            if (assigneePosition === 0) {
                return callable.result;
            } else {
                return undefined;
            }
        }

        // Otherwise, the assignee gets the result at the same position
        const abstractResults = getAbstractResults(callable);
        return abstractResults[assigneePosition];
    }

    /**
     * Returns the callable that is called by the given call. If no callable can be found, returns `undefined`.
     */
    callToCallable(node: TslAbstractCall | undefined): TslCallable | undefined {
        if (!node) {
            return undefined;
        }

        if (isTslAnnotationCall(node)) {
            return node.annotation?.ref;
        } else if (isTslCall(node)) {
            // We ignore nullability, since calls can be made null-safe. For scoping, for instance, we still want to
            // link the arguments of the call properly, even if the user forgot to make the call null-safe. In this
            // case, an error is being shown anyway.
            const receiverType = this.typeComputer().computeType(node.receiver);
            const nonNullableReceiverType = this.typeComputer().computeNonNullableType(receiverType);

            if (nonNullableReceiverType instanceof CallableType) {
                return nonNullableReceiverType.callable;
            } else if (nonNullableReceiverType instanceof StaticType) {
                const declaration = nonNullableReceiverType.instanceType.declaration;
                if (isTslCallable(declaration)) {
                    return declaration;
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

    /**
     * Returns all yields that assign to the given result.
     */
    resultToYields(node: TslResult | undefined): Stream<TslYield> {
        if (!node) {
            return EMPTY_STREAM;
        }

        const containingSegment = AstUtils.getContainerOfType(node, isTslSegment);
        if (!containingSegment) {
            return EMPTY_STREAM;
        }

        return AstUtils.findLocalReferences(node, containingSegment)
            .map((it) => it.$refNode?.astNode)
            .filter(isTslYield);
    }

    /**
     * Returns the type parameter that the type argument is assigned to. If there is no matching type parameter, returns
     * `undefined`.
     */
    typeArgumentToTypeParameter(node: TslTypeArgument | undefined): TslTypeParameter | undefined {
        if (!node) {
            return undefined;
        }

        // Named type argument
        if (node.typeParameter) {
            return node.typeParameter.ref;
        }

        // Positional type argument
        const containingType = AstUtils.getContainerOfType(node, isTslType);
        if (!isTslNamedType(containingType)) {
            return undefined;
        }

        const typeArguments = getTypeArguments(containingType.typeArgumentList);
        const typeArgumentPosition = node.$containerIndex ?? -1;

        // A prior type argument is named
        for (let i = 0; i < typeArgumentPosition; i++) {
            if (TypeArgument.isNamed(typeArguments[i]!)) {
                return undefined;
            }
        }

        // Find type parameter at the same position
        const namedTypeDeclaration = containingType.declaration?.ref;
        const typeParameters = getTypeParameters(namedTypeDeclaration);
        return typeParameters[typeArgumentPosition];
    }
}
