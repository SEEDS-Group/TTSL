import { AstNode, type AstNodeLocator, AstUtils, stream, WorkspaceCache } from 'langium';
import {
    isTslCall,
    isTslFunction,
    isTslParameter,
    TslArgument,
    TslCall,
    TslCallable,
    TslExpression,
    TslFunction,
    TslParameter,
} from '../generated/ast.js';
import type { TTSLNodeMapper } from '../helpers/ttsl-node-mapper.js';
import type { TTSLServices } from '../ttsl-module.js';
import {
    EvaluatedCallable,
    ParameterSubstitutions,
    substitutionsAreEqual,
    UnknownEvaluatedNode,
} from '../partialEvaluation/model.js';
import { CallGraph } from './model.js';
import { getArguments, getParameters } from '../helpers/nodeProperties.js';
import { TTSLTypeComputer } from '../typing/ttsl-type-computer.js';
import { isEmpty } from '../../helpers/collections.js';
import { TTSLPartialEvaluator } from '../partialEvaluation/ttsl-partial-evaluator.js';

export class TTSLCallGraphComputer {
    private readonly astNodeLocator: AstNodeLocator;
    private readonly nodeMapper: TTSLNodeMapper;
    private readonly partialEvaluator: TTSLPartialEvaluator;
    private readonly typeComputer: TTSLTypeComputer;

    /**
     * Stores the calls inside the node with the given ID.
     */
    private readonly callCache: WorkspaceCache<string, TslCall[]>;

    /**
     * Stores the call graph for the callable with the given ID if it is called without substitutions.
     */
    private readonly callGraphCache: WorkspaceCache<string, CallGraph>;

    constructor(services: TTSLServices) {
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.nodeMapper = services.helpers.NodeMapper;
        this.partialEvaluator = services.evaluation.PartialEvaluator;
        this.typeComputer = services.types.TypeComputer;

        this.callCache = new WorkspaceCache(services.shared);
        this.callGraphCache = new WorkspaceCache(services.shared);
    }

    /**
     * Returns whether the given call is recursive using the given parameter substitutions.
     *
     * @param node
     * The call to check.
     *
     * @param substitutions
     * The parameter substitutions to use. These are **not** the argument of the call, but the values of the parameters
     * of any containing callables, i.e. the context of the call.
     */
    isRecursive(node: TslCall, substitutions: ParameterSubstitutions = NO_SUBSTITUTIONS): boolean {
        return this.getCallGraph(node, substitutions).isRecursive;
    }

    /**
     * **If given a call**: Returns a stream of all callables that are called directly or indirectly by the given call.
     * The call graph is traversed depth-first. If a callable is called recursively, it is only included once again.
     *
     * **If given a callable**: Does the above for all calls that get executed in the callable.
     *
     * @param node
     * The call/callable to get the call graph for.
     *
     * @param substitutions
     * The parameter substitutions to use. These are **not** the argument of the call, but the values of the parameters
     * of any containing callables, i.e. the context of the call/callable.
     */
    getCallGraph(node: TslCall | TslCallable, substitutions: ParameterSubstitutions = NO_SUBSTITUTIONS): CallGraph {
        // Cache the result if no substitutions are given
        if (isEmpty(substitutions)) {
            const key = this.getNodeId(node);
            return this.callGraphCache.get(key, () => {
                return this.doGetCallGraph(node, substitutions);
            });
        } else {
            /* c8 ignore next 2 */
            return this.doGetCallGraph(node, substitutions);
        }
    }

    private doGetCallGraph(node: TslCall | TslCallable, substitutions: ParameterSubstitutions): CallGraph {
        if (isTslCall(node)) {
            const call = this.createSyntheticCallForCall(node, substitutions);
            return this.getCallGraphWithRecursionCheck(call, []);
        } else {
            const children = this.getExecutedCallsInCallable(node, substitutions).map((it) => {
                return this.getCallGraphWithRecursionCheck(it, []);
            });
            return new CallGraph(
                node,
                children,
                children.some((it) => it.isRecursive),
            );
        }
    }

    private getCallGraphWithRecursionCheck(syntheticCall: SyntheticCall, visited: SyntheticCall[]): CallGraph {
        const evaluatedCallable = syntheticCall.callable;

        // Handle unknown callables & recursive calls
        if (!evaluatedCallable) {
            return new CallGraph(undefined, [], false);
        } else if (visited.some((it) => it.equals(syntheticCall))) {
            return new CallGraph(evaluatedCallable.callable, [], true);
        }

        // Visit all calls in the callable
        const newVisited = [...visited, syntheticCall];
        const children = this.getExecutedCalls(syntheticCall).map((it) => {
            return this.getCallGraphWithRecursionCheck(it, newVisited);
        });

        return new CallGraph(
            evaluatedCallable.callable,
            children,
            children.some((it) => it.isRecursive),
        );
    }

    private getExecutedCalls(syntheticCall: SyntheticCall): SyntheticCall[] {
        if (!syntheticCall.callable) {
            /* c8 ignore next 2 */
            return [];
        }

        return this.getExecutedCallsInCallable(syntheticCall.callable.callable, syntheticCall.substitutions);
    }

    private getExecutedCallsInCallable(
        callable: TslCallable | TslParameter,
        substitutions: ParameterSubstitutions,
    ): SyntheticCall[] {
        if (isTslFunction(callable)) {
            return this.getExecutedCallsInStubCallable(callable, substitutions);
        } else {
            /* c8 ignore next 2 */
            return [];
        }
    }

    private getExecutedCallsInStubCallable(
        callable: TslFunction,
        substitutions: ParameterSubstitutions,
    ): SyntheticCall[] {
        const callsInDefaultValues = getParameters(callable).flatMap((parameter) => {
            // The default value is only executed if no argument is passed for the parameter
            if (parameter.defaultValue && !substitutions.has(parameter)) {
                // We assume all calls in the default value are executed
                const calls = this.getAllContainedCalls(parameter.defaultValue);
                if (!isEmpty(calls)) {
                    return calls.map((call) => this.createSyntheticCallForCall(call, substitutions));
                }

                // We assume a single callable as default value is executed
                const evaluatedCallable = this.getEvaluatedCallable(parameter.defaultValue, substitutions);
                if (evaluatedCallable) {
                    return [this.createSyntheticCallForEvaluatedCallable(evaluatedCallable)];
                }
            }

            return [];
        });

        const callablesInSubstitutions = stream(substitutions.values()).flatMap((it) => {
            if (it instanceof EvaluatedCallable) {
                return [this.createSyntheticCallForEvaluatedCallable(it)];
            }

            return [];
        });

        return [...callsInDefaultValues, ...callablesInSubstitutions];
    }

    private createSyntheticCallForCall(call: TslCall, substitutions: ParameterSubstitutions): SyntheticCall {
        const evaluatedCallable = this.getEvaluatedCallable(call.receiver, substitutions);
        const newSubstitutions = this.getParameterSubstitutionsAfterCall(
            evaluatedCallable,
            getArguments(call),
            substitutions,
        );
        return new SyntheticCall(evaluatedCallable, newSubstitutions);
    }

    private createSyntheticCallForEvaluatedCallable(evaluatedCallable: EvaluatedCallable): SyntheticCall {
        return new SyntheticCall(evaluatedCallable, evaluatedCallable.substitutionsOnCreation);
    }

    private getEvaluatedCallable(
        expression: TslExpression | undefined,
        substitutions: ParameterSubstitutions,
    ): EvaluatedCallable | undefined {
        if (!expression) {
            /* c8 ignore next 2 */
            return undefined;
        }

        // First try to get the callable via the partial evaluator
        const value = this.partialEvaluator.evaluate(expression, substitutions);
        if (value instanceof EvaluatedCallable) {
            return value;
        }

        return undefined;
    }

    private getParameterSubstitutionsAfterCall(
        callable: EvaluatedCallable | undefined,
        args: TslArgument[],
        substitutions: ParameterSubstitutions,
    ): ParameterSubstitutions {
        if (!callable || isTslParameter(callable.callable)) {
            return NO_SUBSTITUTIONS;
        }

        // Compute which parameters are set via arguments
        const parameters = getParameters(callable.callable);
        const argumentsByParameter = this.nodeMapper.parametersToArguments(parameters, args);

        let result = callable.substitutionsOnCreation;

        for (const parameter of parameters) {
            if (argumentsByParameter.has(parameter)) {
                // Substitutions on call via arguments
                const value =
                    this.getEvaluatedCallable(argumentsByParameter.get(parameter), substitutions) ??
                    UnknownEvaluatedNode;

                // Remember that a value was passed, so calls/callables in default values are not considered later
                result = new Map([...result, [parameter, value]]);
            } else if (parameter.defaultValue) {
                // Substitutions on call via default values
                const value = this.getEvaluatedCallable(parameter.defaultValue, result);
                if (value) {
                    result = new Map([...result, [parameter, value]]);
                }
            }
        }

        return result;
    }

    /**
     * Returns all calls inside the given node. If the given node is a call, it is included as well.
     */
    getAllContainedCalls(node: AstNode | undefined): TslCall[] {
        if (!node) {
            /* c8 ignore next 2 */
            return [];
        }

        const key = this.getNodeId(node);
        return this.callCache.get(key, () => AstUtils.streamAst(node).filter(isTslCall).toArray());
    }

    private getNodeId(node: AstNode) {
        const documentUri = AstUtils.getDocument(node).uri.toString();
        const nodePath = this.astNodeLocator.getAstNodePath(node);
        return `${documentUri}~${nodePath}`;
    }
}

class SyntheticCall {
    constructor(
        readonly callable: EvaluatedCallable | undefined,
        readonly substitutions: ParameterSubstitutions,
    ) {}

    equals(other: SyntheticCall): boolean {
        if (!this.callable) {
            /* c8 ignore next 2 */
            return !other.callable && substitutionsAreEqual(this.substitutions, other.substitutions);
        }

        return this.callable.equals(other.callable) && substitutionsAreEqual(this.substitutions, other.substitutions);
    }
}

const NO_SUBSTITUTIONS: ParameterSubstitutions = new Map();
