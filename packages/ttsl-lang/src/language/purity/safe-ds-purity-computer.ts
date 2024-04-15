import { type AstNode, type AstNodeLocator, AstUtils, EMPTY_STREAM, Stream, WorkspaceCache } from 'langium';
import { isEmpty } from '../../helpers/collections.js';
import type { SafeDsCallGraphComputer } from '../flow/safe-ds-call-graph-computer.js';
import type { SafeDsServices } from '../safe-ds-module.js';
import {
    EndlessRecursion,
    FileRead,
    FileWrite,
    type ImpurityReason,
    OtherImpurityReason,
    PotentiallyImpureParameterCall,
    UnknownCallableCall,
} from './model.js';
import {
    isTslAnnotation,
    isTslAssignment,
    isTslCallable,
    isTslClass,
    isTslEnumVariant,
    isTslExpressionStatement,
    isTslFunction,
    isTslLambda,
    isTslParameter,
    isTslWildcard,
    TslCall,
    TslCallable,
    TslExpression,
    TslFunction,
    TslParameter,
    TslStatement,
} from '../generated/ast.js';
import { EvaluatedEnumVariant, ParameterSubstitutions, StringConstant } from '../partialEvaluation/model.js';
import { SafeDsAnnotations } from '../builtins/safe-ds-annotations.js';
import { SafeDsImpurityReasons } from '../builtins/safe-ds-enums.js';
import { getAssignees, getParameters } from '../helpers/nodeProperties.js';
import { isContainedInOrEqual } from '../helpers/astUtils.js';

export class SafeDsPurityComputer {
    private readonly astNodeLocator: AstNodeLocator;
    private readonly builtinAnnotations: SafeDsAnnotations;
    private readonly builtinImpurityReasons: SafeDsImpurityReasons;
    private readonly callGraphComputer: SafeDsCallGraphComputer;

    private readonly reasonsCache: WorkspaceCache<string, ImpurityReason[]>;

    constructor(services: SafeDsServices) {
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.builtinAnnotations = services.builtins.Annotations;
        this.builtinImpurityReasons = services.builtins.ImpurityReasons;
        this.callGraphComputer = services.flow.CallGraphComputer;

        this.reasonsCache = new WorkspaceCache(services.shared);
    }

    // We need separate methods for callables and expressions because lambdas are both. The caller must decide whether
    // the lambda should get "executed" (***Callable methods) when computing the impurity reasons or not (***Expression
    // methods).

    /**
     * Returns whether the given callable is pure.
     *
     * @param node
     * The callable to check.
     *
     * @param substitutions
     * The parameter substitutions to use. These are **not** the argument of a call, but the values of the parameters
     * of any containing callables, i.e. the context of the node.
     */
    isPureCallable(node: TslCallable | undefined, substitutions = NO_SUBSTITUTIONS): boolean {
        return isEmpty(this.getImpurityReasonsForCallable(node, substitutions));
    }

    /**
     * Returns whether the given expression is pure.
     *
     * @param node
     * The expression to check.
     *
     * @param substitutions
     * The parameter substitutions to use. These are **not** the argument of a call, but the values of the parameters
     * of any containing callables, i.e. the context of the node.
     */
    isPureExpression(node: TslExpression | undefined, substitutions = NO_SUBSTITUTIONS): boolean {
        return isEmpty(this.getImpurityReasonsForExpression(node, substitutions));
    }

    /**
     * Returns whether the given parameter is pure, i.e. only accepts pure callables.
     *
     * @param node
     * The parameter to check.
     */
    isPureParameter(node: TslParameter | undefined): boolean {
        const containingCallable = AstUtils.getContainerOfType(node, isTslCallable);
        if (
            !containingCallable ||
            isTslAnnotation(containingCallable) ||
            isTslClass(containingCallable) ||
            isTslEnumVariant(containingCallable)
        ) {
            return true;
        } else if (isTslFunction(containingCallable)) {
            const expectedImpurityReason = new PotentiallyImpureParameterCall(node);
            return !this.getImpurityReasons(containingCallable).some((it) => it.equals(expectedImpurityReason));
        } else {
            return false;
        }
    }

    /**
     * Returns whether the given callable has side effects.
     *
     * @param node
     * The callable to check.
     *
     * @param substitutions
     * The parameter substitutions to use. These are **not** the argument of a call, but the values of the parameters
     * of any containing callables, i.e. the context of the node.
     */
    callableHasSideEffects(node: TslCallable | undefined, substitutions = NO_SUBSTITUTIONS): boolean {
        return this.getImpurityReasonsForCallable(node, substitutions).some((it) => it.isSideEffect);
    }

    /**
     * Returns whether the given expression has side effects.
     *
     * @param node
     * The expression to check.
     *
     * @param substitutions
     * The parameter substitutions to use. These are **not** the argument of a call, but the values of the parameters
     * of any containing callables, i.e. the context of the node.
     */
    expressionHasSideEffects(node: TslExpression | undefined, substitutions = NO_SUBSTITUTIONS): boolean {
        return this.getImpurityReasonsForExpression(node, substitutions).some((it) => it.isSideEffect);
    }

    /**
     * Returns whether the given statement does something. It must either
     *     - create a placeholder,
     *     - assign to a result, or
     *     - call a function that has side effects.
     *
     * @param node
     * The statement to check.
     *
     * @param substitutions
     * The parameter substitutions to use. These are **not** the argument of a call, but the values of the parameters
     * of any containing callables, i.e. the context of the node.
     */
    statementDoesSomething(node: TslStatement, substitutions = NO_SUBSTITUTIONS): boolean {
        if (isTslAssignment(node)) {
            return (
                !getAssignees(node).every(isTslWildcard) ||
                this.expressionHasSideEffects(node.expression, substitutions)
            );
        } else if (isTslExpressionStatement(node)) {
            return this.expressionHasSideEffects(node.expression, substitutions);
        } else {
            /* c8 ignore next 2 */
            return false;
        }
    }

    /**
     * Returns the reasons why the given callable is impure.
     *
     * @param node
     * The callable to check.
     *
     * @param substitutions
     * The parameter substitutions to use. These are **not** the argument of a call, but the values of the parameters
     * of any containing callables, i.e. the context of the node.
     */
    getImpurityReasonsForCallable(node: TslCallable | undefined, substitutions = NO_SUBSTITUTIONS): ImpurityReason[] {
        return this.getImpurityReasons(node, substitutions);
    }

    /**
     * Returns the reasons why the given statement is impure.
     *
     * @param node
     * The statement to check.
     *
     * @param substitutions
     * The parameter substitutions to use. These are **not** the argument of a call, but the values of the parameters
     * of any containing callables, i.e. the context of the node.
     */
    getImpurityReasonsForStatement(node: TslStatement | undefined, substitutions = NO_SUBSTITUTIONS): ImpurityReason[] {
        if (isTslAssignment(node)) {
            return this.getImpurityReasonsForExpression(node.expression, substitutions);
        } else if (isTslExpressionStatement(node)) {
            return this.getImpurityReasonsForExpression(node.expression, substitutions);
        } else {
            /* c8 ignore next 2 */
            return [];
        }
    }

    /**
     * Returns the reasons why the given expression is impure.
     *
     * @param node
     * The expression to check.
     *
     * @param substitutions
     * The parameter substitutions to use. These are **not** the argument of a call, but the values of the parameters
     * of any containing callables, i.e. the context of the node.
     */
    getImpurityReasonsForExpression(
        node: TslExpression | undefined,
        substitutions = NO_SUBSTITUTIONS,
    ): ImpurityReason[] {
        return this.getExecutedCallsInExpression(node).flatMap((it) => this.getImpurityReasons(it, substitutions));
    }

    private getImpurityReasons(
        node: TslCall | TslCallable | undefined,
        substitutions = NO_SUBSTITUTIONS,
    ): ImpurityReason[] {
        if (!node) {
            /* c8 ignore next 2 */
            return [];
        }

        // Cache the result if no substitutions are given
        if (isEmpty(substitutions)) {
            const key = this.getNodeId(node);
            return this.reasonsCache.get(key, () => this.doGetImpurityReasons(node, substitutions));
        } else {
            /* c8 ignore next 2 */
            return this.doGetImpurityReasons(node, substitutions);
        }
    }

    private doGetImpurityReasons(node: TslCall | TslCallable, substitutions = NO_SUBSTITUTIONS): ImpurityReason[] {
        const callGraph = this.callGraphComputer.getCallGraph(node, substitutions);

        const recursionImpurityReason: ImpurityReason[] = [];
        if (callGraph.isRecursive) {
            recursionImpurityReason.push(EndlessRecursion);
        }

        const otherImpurityReasons = callGraph.streamCalledCallables().flatMap((it) => {
            if (!it) {
                return [UnknownCallableCall];
            } else if (isTslFunction(it)) {
                return this.getImpurityReasonsForFunction(it);
            } else if (
                isTslParameter(it) &&
                // Leads to endless recursion if we don't check this
                // (see test case "should return the impurity reasons of a parameter call in a function")
                !isTslFunction(AstUtils.getContainerOfType(it, isTslCallable)) &&
                !this.isPureParameter(it)
            ) {
                return [new PotentiallyImpureParameterCall(it)];
            } else {
                return EMPTY_STREAM;
            }
        });

        return [...recursionImpurityReason, ...otherImpurityReasons];
    }

    private getExecutedCallsInExpression(expression: TslExpression | undefined): TslCall[] {
        return this.callGraphComputer.getAllContainedCalls(expression).filter((it) => {
            // Keep only calls that are not contained in a lambda inside the expression
            const containingLambda = AstUtils.getContainerOfType(it, isTslLambda);
            return !containingLambda || !isContainedInOrEqual(containingLambda, expression);
        });
    }

    private getImpurityReasonsForFunction(node: TslFunction): Stream<ImpurityReason> {
        return this.builtinAnnotations.streamImpurityReasons(node).flatMap((it) => {
            switch (it.variant) {
                case this.builtinImpurityReasons.FileReadFromConstantPath:
                    return new FileRead(this.getPath(it));
                case this.builtinImpurityReasons.FileReadFromParameterizedPath:
                    return new FileRead(this.getParameter(node, it));
                case this.builtinImpurityReasons.FileWriteToConstantPath:
                    return new FileWrite(this.getPath(it));
                case this.builtinImpurityReasons.FileWriteToParameterizedPath:
                    return new FileWrite(this.getParameter(node, it));
                case this.builtinImpurityReasons.PotentiallyImpureParameterCall:
                    return new PotentiallyImpureParameterCall(this.getParameter(node, it));
                case this.builtinImpurityReasons.Other:
                    return OtherImpurityReason;
                default:
                    /* c8 ignore next */
                    return EMPTY_STREAM;
            }
        });
    }

    private getPath(variant: EvaluatedEnumVariant): string | undefined {
        const path = variant.getParameterValueByName('path');
        if (path instanceof StringConstant) {
            return path.value;
        } else {
            return undefined;
        }
    }

    private getParameter(node: TslFunction, variant: EvaluatedEnumVariant): TslParameter | undefined {
        const parameterName = variant.getParameterValueByName('parameterName');
        if (!(parameterName instanceof StringConstant)) {
            return undefined;
        }

        return getParameters(node).find((it) => it.name === parameterName.value);
    }

    private getNodeId(node: AstNode) {
        const documentUri = AstUtils.getDocument(node).uri.toString();
        const nodePath = this.astNodeLocator.getAstNodePath(node);
        return `${documentUri}~${nodePath}`;
    }
}

const NO_SUBSTITUTIONS: ParameterSubstitutions = new Map();
