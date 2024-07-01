import { AstNode, AstNodeLocator, AstUtils, WorkspaceCache } from 'langium';
import { isEmpty } from '../../helpers/collections.js';
import {
    isTslArgument,
    isTslAssignee,
    isTslAssignment,
    isTslBoolean,
    isTslCall,
    isTslCallable,
    isTslDeclaration,
    isTslExpression,
    isTslFloat,
    isTslFunction,
    isTslIndexedAccess,
    isTslInfixOperation,
    isTslInt,
    isTslList,
    isTslDictionary,
    isTslMemberAccess,
    isTslNull,
    isTslParameter,
    isTslPrefixOperation,
    isTslReference,
    isTslResult,
    isTslTemplateString,
    isTslTemplateStringEnd,
    isTslTemplateStringInner,
    isTslTemplateStringStart,
    isTslTypeCast,
    type TslArgument,
    type TslAssignee,
    type TslCall,
    type TslCallable,
    type TslDeclaration,
    type TslExpression,
    type TslIndexedAccess,
    type TslInfixOperation,
    type TslList,
    type TslDictionary,
    type TslMemberAccess,
    type TslParameter,
    type TslPrefixOperation,
    type TslTemplateString,
    isTslAggregation,
    TslAggregation,
    TslModifier,
    isTslGroupedBy,
    isTslVisibility,
    isTslTimeunit,
    isTslString,
} from '../generated/ast.js';
import { getArguments, getParameters } from '../helpers/nodeProperties.js';
import { SafeDsNodeMapper } from '../helpers/safe-ds-node-mapper.js';
import { SafeDsServices } from '../safe-ds-module.js';
import {
    BlockLambdaClosure,
    BooleanConstant,
    Constant,
    EvaluatedCallable,
    EvaluatedEnumVariant,
    EvaluatedList,
    EvaluatedMap,
    EvaluatedMapEntry,
    EvaluatedNamedTuple,
    EvaluatedNode,
    ExpressionLambdaClosure,
    FloatConstant,
    IntConstant,
    isConstant,
    NamedCallable,
    NullConstant,
    NumberConstant,
    ParameterSubstitutions,
    StringConstant,
    substitutionsAreEqual,
    UnknownEvaluatedNode,
} from './model.js';

export class SafeDsPartialEvaluator {
    private readonly astNodeLocator: AstNodeLocator;
    private readonly nodeMapper: SafeDsNodeMapper;

    private readonly cache: WorkspaceCache<string, EvaluatedNode>;

    constructor(services: SafeDsServices) {
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.nodeMapper = services.helpers.NodeMapper;

        this.cache = new WorkspaceCache(services.shared);
    }

    // -----------------------------------------------------------------------------------------------------------------
    // evaluate
    // -----------------------------------------------------------------------------------------------------------------

    evaluate(node: AstNode | undefined, substitutions: ParameterSubstitutions = NO_SUBSTITUTIONS): EvaluatedNode {
        return this.evaluateWithRecursionCheck(node, substitutions, [])?.unwrap();
    }

    private evaluateWithRecursionCheck(
        node: AstNode | undefined,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        if (!node || visited.some((it) => visitedStatesAreEqual(it, [node, substitutions]))) {
            return UnknownEvaluatedNode;
        }

        // Remember that we have already visited this node
        const newVisited: VisitedState[] = [...visited, [node, substitutions]];

        // Try to evaluate the node without parameter substitutions and cache the result
        const resultWithoutSubstitutions = this.cache.get(this.getNodeId(node), () =>
            this.doEvaluateWithRecursionCheck(node, NO_SUBSTITUTIONS, newVisited),
        );
        if (resultWithoutSubstitutions.isFullyEvaluated || isEmpty(substitutions)) {
            return resultWithoutSubstitutions;
        } else {
            // Try again with parameter substitutions but don't cache the result
            return this.doEvaluateWithRecursionCheck(node, substitutions, newVisited);
        }
    }

    private getNodeId(node: AstNode) {
        const documentUri = AstUtils.getDocument(node).uri.toString();
        const nodePath = this.astNodeLocator.getAstNodePath(node);
        return `${documentUri}~${nodePath}`;
    }

    private doEvaluateWithRecursionCheck(
        node: AstNode | undefined,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        if (isTslAssignee(node)) {
            return this.evaluateAssignee(node, substitutions, visited);
        } else if (isTslDeclaration(node)) {
            return this.evaluateDeclaration(node, substitutions, visited);
        } else if (isTslExpression(node)) {
            return this.evaluateExpression(node, substitutions, visited);
        } /* c8 ignore start */ else {
            return UnknownEvaluatedNode;
        } /* c8 ignore stop */
    }

    private evaluateAssignee(
        node: TslAssignee,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        const containingAssignment = AstUtils.getContainerOfType(node, isTslAssignment);
        if (!containingAssignment) {
            /* c8 ignore next 2 */
            return UnknownEvaluatedNode;
        }

        const evaluatedExpression = this.evaluateWithRecursionCheck(
            containingAssignment.expression,
            substitutions,
            visited,
        );
        const nodeIndex = node.$containerIndex ?? -1;
        if (evaluatedExpression instanceof EvaluatedNamedTuple) {
            return evaluatedExpression.getResultValueByIndex(nodeIndex);
        } else if (nodeIndex === 0) {
            return evaluatedExpression;
        } else {
            return UnknownEvaluatedNode;
        }
    }

    private evaluateDeclaration(
        node: TslDeclaration,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        if (isTslFunction(node)) {
            return new NamedCallable(node);
        } else if (isTslParameter(node)) {
            return substitutions.get(node) ?? UnknownEvaluatedNode;
        } else {
            return UnknownEvaluatedNode;
        }
    }
    private evaluateExpression(
        node: TslExpression,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        // Base cases
        if (isTslBoolean(node)) {
            return new BooleanConstant(node.value);
        } else if (isTslFloat(node)) {
            return new FloatConstant(node.value);
        } else if (isTslInt(node)) {
            return new IntConstant(node.value);
        } else if (isTslNull(node)) {
            return NullConstant;
        } else if (isTslString(node)) {
            return new StringConstant(node.value);
        } else if (isTslTemplateStringStart(node)) {
            return new StringConstant(node.value);
        } else if (isTslTemplateStringInner(node)) {
            return new StringConstant(node.value);
        } else if (isTslTemplateStringEnd(node)) {
            return new StringConstant(node.value);
        }

        // Recursive cases
        else if (isTslArgument(node)) {
            return this.evaluateWithRecursionCheck(node.value, substitutions, visited);
        } else if (isTslCall(node)) {
            return this.evaluateCall(node, substitutions, visited);
        } else if (isTslIndexedAccess(node)) {
            return this.evaluateIndexedAccess(node, substitutions, visited);
        } else if (isTslInfixOperation(node)) {
            return this.evaluateInfixOperation(node, substitutions, visited);
        } else if (isTslList(node)) {
            return this.evaluateList(node, substitutions, visited);
        } else if (isTslDictionary(node)) {
            return this.evaluateMap(node, substitutions, visited);
        } else if (isTslMemberAccess(node)) {
            return this.evaluateMemberAccess(node, substitutions, visited);
        } else if (isTslPrefixOperation(node)) {
            return this.evaluatePrefixOperation(node, substitutions, visited);
        } else if (isTslReference(node)) {
            return this.evaluateWithRecursionCheck(node.target.ref, substitutions, visited);
        } else if (isTslTemplateString(node)) {
            return this.evaluateTemplateString(node, substitutions, visited);
        } else if (isTslTypeCast(node)) {
            return this.evaluateWithRecursionCheck(node.expression, substitutions, visited);
        } else if (isTslAggregation(node)) {
            return this.evaluateAggregation(node, substitutions, visited);
        } /* c8 ignore start */ else {
            throw new Error(`Unexpected expression type: ${node.$type}`);
        } /* c8 ignore stop */
    }

    private evaluateInfixOperation(
        node: TslInfixOperation,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        // Handle operators that can short-circuit
        const evaluatedLeft = this.evaluateWithRecursionCheck(node.leftOperand, substitutions, visited);
        if (evaluatedLeft === UnknownEvaluatedNode) {
            return UnknownEvaluatedNode;
        }

        switch (node.operator) {
            case 'or':
                return this.evaluateOr(evaluatedLeft, node.rightOperand, substitutions, visited);
            case 'and':
                return this.evaluateAnd(evaluatedLeft, node.rightOperand, substitutions, visited);
            case '?:':
                return this.evaluateElvisOperator(evaluatedLeft, node.rightOperand, substitutions, visited);
        }

        // Handle other operators
        const evaluatedRight = this.evaluateWithRecursionCheck(node.rightOperand, substitutions, visited);
        if (evaluatedRight === UnknownEvaluatedNode) {
            return UnknownEvaluatedNode;
        }

        switch (node.operator) {
            case '==':
            case '===':
                return new BooleanConstant(evaluatedLeft.equals(evaluatedRight));
            case '!=':
            case '!==':
                return new BooleanConstant(!evaluatedLeft.equals(evaluatedRight));
            case '<':
                return this.evaluateComparisonOp(
                    evaluatedLeft,
                    (leftOperand, rightOperand) => leftOperand < rightOperand,
                    evaluatedRight,
                );
            case '<=':
                return this.evaluateComparisonOp(
                    evaluatedLeft,
                    (leftOperand, rightOperand) => leftOperand <= rightOperand,
                    evaluatedRight,
                );
            case '>=':
                return this.evaluateComparisonOp(
                    evaluatedLeft,
                    (leftOperand, rightOperand) => leftOperand >= rightOperand,
                    evaluatedRight,
                );
            case '>':
                return this.evaluateComparisonOp(
                    evaluatedLeft,
                    (leftOperand, rightOperand) => leftOperand > rightOperand,
                    evaluatedRight,
                );
            case '+':
                return this.evaluateArithmeticOp(
                    evaluatedLeft,
                    (leftOperand, rightOperand) => leftOperand + rightOperand,
                    (leftOperand, rightOperand) => leftOperand + rightOperand,
                    evaluatedRight,
                );
            case '-':
                return this.evaluateArithmeticOp(
                    evaluatedLeft,
                    (leftOperand, rightOperand) => leftOperand - rightOperand,
                    (leftOperand, rightOperand) => leftOperand - rightOperand,
                    evaluatedRight,
                );
            case '*':
                return this.evaluateArithmeticOp(
                    evaluatedLeft,
                    (leftOperand, rightOperand) => leftOperand * rightOperand,
                    (leftOperand, rightOperand) => leftOperand * rightOperand,
                    evaluatedRight,
                );
            case '/':
                // Division by zero
                if (zeroConstants.some((it) => it.equals(evaluatedRight))) {
                    return UnknownEvaluatedNode;
                }

                return this.evaluateArithmeticOp(
                    evaluatedLeft,
                    (leftOperand, rightOperand) => leftOperand / rightOperand,
                    (leftOperand, rightOperand) => leftOperand / rightOperand,
                    evaluatedRight,
                );

            /* c8 ignore next 2 */
            default:
                throw new Error(`Unexpected operator: ${node.operator}`);
        }
    }

    private evaluateOr(
        evaluatedLeft: EvaluatedNode,
        rightOperand: TslExpression,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        // Short-circuit
        if (evaluatedLeft.equals(trueConstant)) {
            return trueConstant;
        }

        // Compute the result if both operands are constant booleans
        const evaluatedRight = this.evaluateWithRecursionCheck(rightOperand, substitutions, visited);
        if (evaluatedLeft instanceof BooleanConstant && evaluatedRight instanceof BooleanConstant) {
            return new BooleanConstant(evaluatedLeft.value || evaluatedRight.value);
        }

        return UnknownEvaluatedNode;
    }

    private evaluateAnd(
        evaluatedLeft: EvaluatedNode,
        rightOperand: TslExpression,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        // Short-circuit
        if (evaluatedLeft.equals(falseConstant)) {
            return falseConstant;
        }

        // Compute the result if both operands are constant booleans
        const evaluatedRight = this.evaluateWithRecursionCheck(rightOperand, substitutions, visited);
        if (evaluatedLeft instanceof BooleanConstant && evaluatedRight instanceof BooleanConstant) {
            return new BooleanConstant(evaluatedLeft.value && evaluatedRight.value);
        }

        return UnknownEvaluatedNode;
    }

    private evaluateElvisOperator(
        evaluatedLeft: EvaluatedNode,
        rightOperand: TslExpression,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        // Short-circuit
        if (evaluatedLeft instanceof Constant && !evaluatedLeft.equals(NullConstant)) {
            return evaluatedLeft;
        }

        // Compute the result from both operands
        const evaluatedRight = this.evaluateWithRecursionCheck(rightOperand, substitutions, visited);
        if (evaluatedLeft.equals(NullConstant)) {
            return evaluatedRight;
        } else if (evaluatedRight === UnknownEvaluatedNode) {
            return UnknownEvaluatedNode;
        } else {
            return evaluatedLeft;
        }
    }

    private evaluateComparisonOp(
        leftOperand: EvaluatedNode,
        operation: (leftOperand: number | bigint, rightOperand: number | bigint) => boolean,
        rightOperand: EvaluatedNode,
    ): EvaluatedNode {
        if (leftOperand instanceof NumberConstant && rightOperand instanceof NumberConstant) {
            return new BooleanConstant(operation(leftOperand.value, rightOperand.value));
        }

        return UnknownEvaluatedNode;
    }

    private evaluateArithmeticOp(
        leftOperand: EvaluatedNode,
        intOperation: (leftOperand: bigint, rightOperand: bigint) => bigint,
        floatOperation: (leftOperand: number, rightOperand: number) => number,
        rightOperand: EvaluatedNode,
    ): EvaluatedNode {
        if (leftOperand instanceof IntConstant && rightOperand instanceof IntConstant) {
            return new IntConstant(intOperation(leftOperand.value, rightOperand.value));
        } else if (leftOperand instanceof NumberConstant && rightOperand instanceof NumberConstant) {
            return new FloatConstant(floatOperation(Number(leftOperand.value), Number(rightOperand.value)));
        }

        return UnknownEvaluatedNode;
    }

    private evaluateList(node: TslList, substitutions: ParameterSubstitutions, visited: VisitedState[]): EvaluatedNode {
        return new EvaluatedList(
            node.elements.map((it) => this.evaluateWithRecursionCheck(it, substitutions, visited)),
        );
    }

    private evaluateMap(node: TslDictionary, substitutions: ParameterSubstitutions, visited: VisitedState[]): EvaluatedNode {
        return new EvaluatedMap(
            node.entries.map((it) => {
                const key = this.evaluateWithRecursionCheck(it.key, substitutions, visited);
                const value = this.evaluateWithRecursionCheck(it.value, substitutions, visited);
                return new EvaluatedMapEntry(key, value);
            }),
        );
    }

    private evaluatePrefixOperation(
        node: TslPrefixOperation,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        const evaluatedOperand = this.evaluateWithRecursionCheck(node.operand, substitutions, visited);
        if (evaluatedOperand === UnknownEvaluatedNode) {
            return UnknownEvaluatedNode;
        }

        if (node.operator === 'not') {
            if (evaluatedOperand instanceof BooleanConstant) {
                return new BooleanConstant(!evaluatedOperand.value);
            }
        } else if (node.operator === '-') {
            if (evaluatedOperand instanceof FloatConstant) {
                return new FloatConstant(-evaluatedOperand.value);
            } else if (evaluatedOperand instanceof IntConstant) {
                return new IntConstant(-evaluatedOperand.value);
            }
        }

        return UnknownEvaluatedNode;
    }

    private evaluateTemplateString(
        node: TslTemplateString,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        const expressions = node.expressions.map((it) => this.evaluateWithRecursionCheck(it, substitutions, visited));
        if (expressions.every(isConstant)) {
            return new StringConstant(expressions.map((it) => it.toInterpolationString()).join(''));
        }

        return UnknownEvaluatedNode;
    }

    private evaluateCall(node: TslCall, substitutions: ParameterSubstitutions, visited: VisitedState[]): EvaluatedNode {
        const receiver = this.evaluateWithRecursionCheck(node.receiver, substitutions, visited).unwrap();
        const args = getArguments(node);

        if (receiver instanceof EvaluatedEnumVariant) {
            return this.evaluateEnumVariantCall(receiver, args, substitutions, visited);
        } else if (receiver instanceof EvaluatedCallable) {
            return this.evaluateCallableCall(
                receiver.callable,
                args,
                receiver.substitutionsOnCreation,
                substitutions,
                visited,
            );
        } else if (receiver.equals(NullConstant) && node.isNullSafe) {
            return NullConstant;
        }

        return UnknownEvaluatedNode;
    }

    private evaluateAggregation(node: TslAggregation, substitutions: ParameterSubstitutions, visited: VisitedState[]): EvaluatedNode {
        const data = this.evaluateExpression(node.data, substitutions, visited).unwrap();
        const funct = this.evaluateExpression(node.function, substitutions, visited).unwrap();
        const groupedBy = this.evaluateModifier(node.groupedBy, substitutions, visited).unwrap();

        return UnknownEvaluatedNode;
    }

    private evaluateModifier(node: TslModifier, substitutions: ParameterSubstitutions, visited: VisitedState[]): EvaluatedNode {
        if (isTslGroupedBy(node)) {
            return this.evaluateExpression(node.id, substitutions, visited);
        } else if (isTslVisibility(node)) {
            throw new Error(`noch nicht evaluierbar`);
        } else if (isTslTimeunit(node)) {
            throw new Error(`noch nicht evaluierbar`);
        }/* c8 ignore start */ else {
            throw new Error(`Unexpected Modifier type: ${node.$type}`);
        } /* c8 ignore stop */
    }

    private evaluateEnumVariantCall(
        receiver: EvaluatedEnumVariant,
        args: TslArgument[],
        substitutions: Map<TslParameter, EvaluatedNode>,
        visited: VisitedState[],
    ) {
        // The enum variant has already been instantiated
        if (receiver.hasBeenInstantiated) {
            return UnknownEvaluatedNode;
        }

        const parameterSubstitutionsAfterCall = this.getParameterSubstitutionsAfterCall(
            receiver.variant,
            args,
            NO_SUBSTITUTIONS,
            substitutions,
            visited,
        );

        return new EvaluatedEnumVariant(receiver.variant, parameterSubstitutionsAfterCall);
    }

    private evaluateCallableCall(
        callable: TslCallable | TslParameter,
        args: TslArgument[],
        substitutionsOnCreation: ParameterSubstitutions,
        substitutionsOnCall: ParameterSubstitutions,
        visited: VisitedState[],
    ) {
        if (!isTslCallable(callable)) {
            /* c8 ignore next 2 */
            return UnknownEvaluatedNode;
        }

        const parameterSubstitutionsAfterCall = this.getParameterSubstitutionsAfterCall(
            callable,
            args,
            substitutionsOnCreation,
            substitutionsOnCall,
            visited,
        );

        return UnknownEvaluatedNode;
    }

    private getParameterSubstitutionsAfterCall(
        callable: TslCallable | TslParameter | undefined,
        args: TslArgument[],
        substitutionsOnCreation: ParameterSubstitutions,
        substitutionsOnCall: ParameterSubstitutions,
        visited: VisitedState[],
    ): ParameterSubstitutions {
        if (!callable || isTslParameter(callable)) {
            /* c8 ignore next 2 */
            return NO_SUBSTITUTIONS;
        }

        // Compute which parameters are set via arguments
        const parameters = getParameters(callable);
        const argumentsByParameter = this.nodeMapper.parametersToArguments(parameters, args);

        let result = substitutionsOnCreation;

        for (const parameter of parameters) {
            if (argumentsByParameter.has(parameter)) {
                // Substitutions on call via arguments
                const value = this.evaluateWithRecursionCheck(
                    argumentsByParameter.get(parameter),
                    substitutionsOnCall,
                    visited,
                );
                if (value !== UnknownEvaluatedNode) {
                    result = new Map([...result, [parameter, value]]);
                }
            } else if (parameter.defaultValue) {
                // Substitutions on call via default values
                const value = this.evaluateWithRecursionCheck(parameter.defaultValue, result, visited);
                if (value !== UnknownEvaluatedNode) {
                    result = new Map([...result, [parameter, value]]);
                }
            }
        }

        return result;
    }

    private evaluateIndexedAccess(
        node: TslIndexedAccess,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        const receiver = this.evaluateWithRecursionCheck(node.receiver, substitutions, visited).unwrap();

        if (receiver instanceof EvaluatedList) {
            const index = this.evaluateWithRecursionCheck(node.index, substitutions, visited).unwrap();
            if (index instanceof IntConstant) {
                return receiver.getElementByIndex(Number(index.value));
            }
        } else if (receiver instanceof EvaluatedMap) {
            const key = this.evaluateWithRecursionCheck(node.index, substitutions, visited).unwrap();
            return receiver.getLastValueForKey(key);
        } else if (receiver.equals(NullConstant) && node.isNullSafe) {
            return NullConstant;
        }

        return UnknownEvaluatedNode;
    }

    private evaluateMemberAccess(
        node: TslMemberAccess,
        substitutions: ParameterSubstitutions,
        visited: VisitedState[],
    ): EvaluatedNode {
        const member = node.member?.target?.ref;
        if (!member) {
            return UnknownEvaluatedNode;
        }

        const receiver = this.evaluateWithRecursionCheck(node.receiver, substitutions, visited);
        if (receiver instanceof EvaluatedEnumVariant) {
            return receiver.getParameterValueByName(member.name);
        } else if (receiver instanceof EvaluatedNamedTuple) {
            return receiver.getResultValueByName(member.name);
        } else if (receiver.equals(NullConstant) && node.isNullSafe) {
            return NullConstant;
        }

        return UnknownEvaluatedNode;
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Parameter substitutions
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Returns the parameter substitutions for the given call.
     */
    computeParameterSubstitutionsForCall(
        call: TslCall | undefined,
        substitutions: ParameterSubstitutions = NO_SUBSTITUTIONS,
    ): ParameterSubstitutions {
        const callable = this.nodeMapper.callToCallable(call);
        const args = getArguments(call);
        return this.getParameterSubstitutionsAfterCall(callable, args, NO_SUBSTITUTIONS, substitutions, []);
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Checks
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Returns whether the given expression can be the value of a constant parameter.
     */
    canBeValueOfConstantParameter = (node: TslExpression): boolean => {
        if (isTslBoolean(node) || isTslFloat(node) || isTslInt(node) || isTslNull(node) || isTslString(node)) {
            return true;
        } else if (isTslCall(node)) {
            // If some arguments are not provided, we already show an error.
            return (
                this.canBeValueOfConstantParameter(node.receiver) &&
                getArguments(node).every((it) => this.canBeValueOfConstantParameter(it.value))
            );
        } else if (isTslList(node)) {
            return node.elements.every(this.canBeValueOfConstantParameter);
        } else if (isTslDictionary(node)) {
            return node.entries.every(
                (it) => this.canBeValueOfConstantParameter(it.key) && this.canBeValueOfConstantParameter(it.value),
            );
        } else if (isTslMemberAccess(node)) {
            // 1. We cannot allow all member accesses, since we might also access an attribute that has type 'Int', for
            //    example. Thus, type checking does not always show an error, even though we already restrict the
            //    possible types of constant parameters.
            // 2. If the member cannot be resolved, we already show an error.
            // 3. If the enum variant has parameters that are not provided, we already show an error.
            const member = node.member?.target?.ref;
            return !member;
        } else if (isTslPrefixOperation(node)) {
            return node.operator === '-' && this.canBeValueOfConstantParameter(node.operand);
        } else if (isTslReference(node)) {
            // If the reference cannot be resolved, we already show an error.
            return !node.target.ref;
        } else {
            return false;
        }
    };
}

const NO_SUBSTITUTIONS: ParameterSubstitutions = new Map();
const falseConstant = new BooleanConstant(false);
const trueConstant = new BooleanConstant(true);
const zeroConstants = [new IntConstant(0n), new FloatConstant(0.0), new FloatConstant(-0.0)];

type VisitedState = [AstNode, ParameterSubstitutions];

const visitedStatesAreEqual = (a: VisitedState, b: VisitedState) => a[0] === b[0] && substitutionsAreEqual(a[1], b[1]);
