import {
    ParameterSubstitutions,
    ConstantBoolean,
    ConstantExpression,
    ConstantFloat,
    ConstantInt,
    ConstantNull,
    ConstantString,
    IntermediateBlockLambda,
    IntermediateExpressionLambda,
    SimplifiedExpression,
} from './model.js';
import { AstNode } from 'langium';
import {
    isSdsArgument,
    isSdsBlockLambda,
    isSdsBoolean,
    isSdsCall,
    isSdsExpression,
    isSdsExpressionLambda,
    isSdsFloat,
    isSdsIndexedAccess,
    isSdsInfixOperation,
    isSdsInt,
    isSdsMemberAccess,
    isSdsNull,
    isSdsParenthesizedExpression,
    isSdsPrefixOperation,
    isSdsReference,
    isSdsString,
    isSdsTemplateString,
    isSdsTemplateStringEnd,
    isSdsTemplateStringInner,
    isSdsTemplateStringStart,
    SdsBlockLambda,
    SdsCall,
    SdsExpressionLambda,
    SdsIndexedAccess,
    SdsInfixOperation,
    SdsMemberAccess,
    SdsPrefixOperation,
    SdsReference,
    SdsTemplateString,
} from '../generated/ast.js';

/* c8 ignore start */
/**
 * Tries to evaluate this expression. On success an SdsConstantExpression is returned, otherwise `undefined`.
 */
export const toConstantExpressionOrUndefined = (node: AstNode | undefined): ConstantExpression | undefined => {
    if (!node) {
        return undefined;
    }

    return toConstantExpressionOrUndefinedImpl(node, new Map());
};

const toConstantExpressionOrUndefinedImpl = (
    node: AstNode,
    substitutions: ParameterSubstitutions,
): ConstantExpression | undefined => {
    const simplifiedExpression = simplify(node, substitutions)?.unwrap();
    if (simplifiedExpression instanceof ConstantExpression) {
        return simplifiedExpression;
    } else {
        return undefined;
    }
};

const simplify = (node: AstNode, substitutions: ParameterSubstitutions): SimplifiedExpression | undefined => {
    // Only expressions have a value
    if (!isSdsExpression(node)) {
        return undefined;
    }

    // Base cases
    if (isSdsBoolean(node)) {
        return new ConstantBoolean(node.value);
    } else if (isSdsFloat(node)) {
        return new ConstantFloat(node.value);
    } else if (isSdsInt(node)) {
        return new ConstantInt(BigInt(node.value));
    } else if (isSdsNull(node)) {
        return ConstantNull;
    } else if (isSdsString(node)) {
        return new ConstantString(node.value);
    } else if (isSdsTemplateStringStart(node)) {
        return new ConstantString(node.value);
    } else if (isSdsTemplateStringInner(node)) {
        return new ConstantString(node.value);
    } else if (isSdsTemplateStringEnd(node)) {
        return new ConstantString(node.value);
    } else if (isSdsBlockLambda(node)) {
        return simplifyBlockLambda(node, substitutions);
    } else if (isSdsExpressionLambda(node)) {
        return simplifyExpressionLambda(node, substitutions);
    }

    // Simple recursive cases
    else if (isSdsArgument(node)) {
        return simplify(node.value, substitutions);
    } else if (isSdsInfixOperation(node)) {
        return simplifyInfixOperation(node, substitutions);
    } else if (isSdsParenthesizedExpression(node)) {
        return simplify(node.expression, substitutions);
    } else if (isSdsPrefixOperation(node)) {
        return simplifyPrefixOperation(node, substitutions);
    } else if (isSdsTemplateString(node)) {
        return simplifyTemplateString(node, substitutions);
    }

    // Complex recursive cases
    else if (isSdsCall(node)) {
        return simplifyCall(node, substitutions);
    } else if (isSdsIndexedAccess(node)) {
        return simplifyIndexedAccess(node, substitutions);
    } else if (isSdsMemberAccess(node)) {
        return simplifyMemberAccess(node, substitutions);
    } else if (isSdsReference(node)) {
        return simplifyReference(node, substitutions);
    }

    // Raise if case is missing (should not happen)
    /* c8 ignore next */
    throw new Error(`Missing case to handle ${node.$type}.`);
};

const simplifyBlockLambda = (
    _node: SdsBlockLambda,
    _substitutions: ParameterSubstitutions,
): IntermediateBlockLambda | undefined => {
    //     return when {
    //     callableHasNoSideEffects(resultIfUnknown = true) -> SdsIntermediateBlockLambda(
    //     parameters = parametersOrEmpty(),
    //     results = blockLambdaResultsOrEmpty(),
    //     substitutionsOnCreation = substitutions
    // )
    // else -> undefined
    // }
    return undefined;
};

const simplifyExpressionLambda = (
    _node: SdsExpressionLambda,
    _substitutions: ParameterSubstitutions,
): IntermediateExpressionLambda | undefined => {
    //     return when {
    //     callableHasNoSideEffects(resultIfUnknown = true) -> SdsIntermediateExpressionLambda(
    //     parameters = parametersOrEmpty(),
    //     result = result,
    //     substitutionsOnCreation = substitutions
    // )
    // else -> undefined
    // }
    return undefined;
};

const simplifyInfixOperation = (
    node: SdsInfixOperation,
    substitutions: ParameterSubstitutions,
): ConstantExpression | undefined => {
    // By design none of the operators are short-circuited
    const constantLeft = toConstantExpressionOrUndefinedImpl(node.leftOperand, substitutions);
    if (!constantLeft) return;

    const constantRight = toConstantExpressionOrUndefinedImpl(node.rightOperand, substitutions);
    if (!constantRight) return;

    //     return when (operator()) {
    //     Or -> simplifyLogicalOp(constantLeft, Boolean::or, constantRight)
    // And -> simplifyLogicalOp(constantLeft, Boolean::and, constantRight)
    // Equals -> SdsConstantBoolean(constantLeft == constantRight)
    // NotEquals -> SdsConstantBoolean(constantLeft != constantRight)
    // IdenticalTo -> SdsConstantBoolean(constantLeft == constantRight)
    // NotIdenticalTo -> SdsConstantBoolean(constantLeft != constantRight)
    // LessThan -> simplifyComparisonOp(
    //     constantLeft,
    //     { a, b -> a < b },
    // { a, b -> a < b },
    // constantRight
    // )
    // LessThanOrEquals -> simplifyComparisonOp(
    //     constantLeft,
    //     { a, b -> a <= b },
    // { a, b -> a <= b },
    // constantRight
    // )
    // GreaterThanOrEquals -> simplifyComparisonOp(
    //     constantLeft,
    //     { a, b -> a >= b },
    // { a, b -> a >= b },
    // constantRight
    // )
    // GreaterThan -> simplifyComparisonOp(
    //     constantLeft,
    //     { a, b -> a > b },
    // { a, b -> a > b },
    // constantRight
    // )
    // Plus -> simplifyArithmeticOp(
    //     constantLeft,
    //     { a, b -> a + b },
    // { a, b -> a + b },
    // constantRight
    // )
    // InfixMinus -> simplifyArithmeticOp(
    //     constantLeft,
    //     { a, b -> a - b },
    // { a, b -> a - b },
    // constantRight
    // )
    // Times -> simplifyArithmeticOp(
    //     constantLeft,
    //     { a, b -> a * b },
    // { a, b -> a * b },
    // constantRight
    // )
    // By -> {
    //     if (constantRight == SdsConstantFloat(0.0) || constantRight == SdsConstantInt(0)) {
    //         return undefined
    //     }
    //
    //     simplifyArithmeticOp(
    //         constantLeft,
    //         { a, b -> a / b },
    //     { a, b -> a / b },
    //     constantRight
    // )
    // }
    // Elvis -> when (constantLeft) {
    //     SdsConstantNull -> constantRight
    // else -> constantLeft
    // }
    // }
    return undefined;
};

// private fun simplifyLogicalOp(
//     leftOperand: SdsConstantExpression,
//     operation: (Boolean, Boolean) -> Boolean,
//     rightOperand: SdsConstantExpression,
// ): SdsConstantExpression? {
//
//     return when {
//     leftOperand is SdsConstantBoolean && rightOperand is SdsConstantBoolean -> {
//     SdsConstantBoolean(operation(leftOperand.value, rightOperand.value))
// }
// else -> undefined
// }
// }
//
// private fun simplifyComparisonOp(
//     leftOperand: SdsConstantExpression,
//     doubleOperation: (Double, Double) -> Boolean,
//     intOperation: (Int, Int) -> Boolean,
//     rightOperand: SdsConstantExpression,
// ): SdsConstantExpression? {
//
//     return when {
//     leftOperand is SdsConstantInt && rightOperand is SdsConstantInt -> {
//     SdsConstantBoolean(intOperation(leftOperand.value, rightOperand.value))
// }
// leftOperand is SdsConstantNumber && rightOperand is SdsConstantNumber -> {
//     SdsConstantBoolean(doubleOperation(leftOperand.value.toDouble(), rightOperand.value.toDouble()))
// }
// else -> undefined
// }
// }
//
// private fun simplifyArithmeticOp(
//     leftOperand: SdsConstantExpression,
//     doubleOperation: (Double, Double) -> Double,
//     intOperation: (Int, Int) -> Int,
//     rightOperand: SdsConstantExpression,
// ): SdsConstantExpression? {
//
//     return when {
//     leftOperand is SdsConstantInt && rightOperand is SdsConstantInt -> {
//     SdsConstantInt(intOperation(leftOperand.value, rightOperand.value))
// }
// leftOperand is SdsConstantNumber && rightOperand is SdsConstantNumber -> {
//     SdsConstantFloat(doubleOperation(leftOperand.value.toDouble(), rightOperand.value.toDouble()))
// }
// else -> undefined
// }
// }

const simplifyPrefixOperation = (
    node: SdsPrefixOperation,
    substitutions: ParameterSubstitutions,
): ConstantExpression | undefined => {
    const constantOperand = toConstantExpressionOrUndefinedImpl(node.operand, substitutions);
    if (!constantOperand) return;

    if (node.operator === 'not') {
        if (constantOperand instanceof ConstantBoolean) {
            return new ConstantBoolean(!constantOperand.value);
        }
    } else if (node.operator === '-') {
        if (constantOperand instanceof ConstantFloat) {
            return new ConstantFloat(-constantOperand.value);
        } else if (constantOperand instanceof ConstantInt) {
            return new ConstantInt(-constantOperand.value);
        }
    }

    return undefined;
};

const simplifyTemplateString = (
    node: SdsTemplateString,
    substitutions: ParameterSubstitutions,
): ConstantExpression | undefined => {
    const constantExpressions = node.expressions.map((it) => toConstantExpressionOrUndefinedImpl(it, substitutions));
    if (constantExpressions.some((it) => it === undefined)) {
        return undefined;
    }

    return new ConstantString(constantExpressions.map((it) => it!.toInterpolationString()).join(''));
};

const simplifyCall = (_node: SdsCall, _substitutions: ParameterSubstitutions): SimplifiedExpression | undefined => {
    //     val simpleReceiver = simplifyReceiver(substitutions) ?: return undefined
    //     val newSubstitutions = buildNewSubstitutions(simpleReceiver, substitutions)
    //
    //     return when (simpleReceiver) {
    //     is SdsIntermediateBlockLambda -> {
    //         SdsIntermediateRecord(
    //             simpleReceiver.results.map {
    //             it to it.simplifyAssignee(newSubstitutions)
    //         }
    //     )
    //     }
    //     is SdsIntermediateExpressionLambda -> simpleReceiver.result.simplify(newSubstitutions)
    //     is SdsIntermediateStep -> {
    //         SdsIntermediateRecord(
    //             simpleReceiver.results.map {
    //             it to it.uniqueYieldOrNull()?.simplifyAssignee(newSubstitutions)
    //         }
    //     )
    //     }
    // }
    return undefined;
};

// private fun SdsCall.simplifyReceiver(substitutions: ParameterSubstitutions): SdsIntermediateCallable? {
//     return when (val simpleReceiver = receiver.simplify(substitutions)) {
//     is SdsIntermediateRecord -> simpleReceiver.unwrap() as? SdsIntermediateCallable
//     is SdsIntermediateCallable -> simpleReceiver
// else -> return undefined
// }
// }
//
// private fun SdsCall.buildNewSubstitutions(
//     simpleReceiver: SdsIntermediateCallable,
//     oldSubstitutions: ParameterSubstitutions
// ): ParameterSubstitutions {
//
//     val substitutionsOnCreation = when (simpleReceiver) {
//         is SdsIntermediateBlockLambda -> simpleReceiver.substitutionsOnCreation
//         is SdsIntermediateExpressionLambda -> simpleReceiver.substitutionsOnCreation
//     else -> emptyMap()
//     }
//
//     val substitutionsOnCall = argumentsOrEmpty()
//         .groupBy { it.parameterOrNull() }
// .mapValues { (parameter, arguments) ->
//         when {
//         parameter == undefined -> undefined
//         parameter.isVariadic -> SdsIntermediateVariadicArguments(
//             arguments.map { it.simplify(oldSubstitutions) }
//     )
//     else -> arguments.uniqueOrNull()?.simplify(oldSubstitutions)
//     }
//     }
//
//     return buildMap {
//         putAll(substitutionsOnCreation)
//         substitutionsOnCall.entries.forEach { (parameter, argument) ->
//             if (parameter != undefined) {
//                 put(parameter, argument)
//             }
//         }
//     }
// }

const simplifyIndexedAccess = (
    _node: SdsIndexedAccess,
    _substitutions: ParameterSubstitutions,
): SimplifiedExpression | undefined => {
    //         val simpleReceiver = receiver.simplify(substitutions) as? SdsIntermediateVariadicArguments ?: return undefined
    //         val simpleIndex = index.simplify(substitutions) as? SdsConstantInt ?: return undefined
    //
    //         return simpleReceiver.getArgumentByIndexOrNull(simpleIndex.value)
    //     }
    return undefined;
};

const simplifyMemberAccess = (
    _node: SdsMemberAccess,
    _substitutions: ParameterSubstitutions,
): SimplifiedExpression | undefined => {
    //     private fun SdsMemberAccess.simplifyMemberAccess(substitutions: ParameterSubstitutions): SdsSimplifiedExpression? {
    //     if (member.declaration is SdsEnumVariant) {
    //     return member.simplifyReference(substitutions)
    // }
    //
    // return when (val simpleReceiver = receiver.simplify(substitutions)) {
    //     SdsConstantNull -> when {
    //         isNullSafe -> SdsConstantNull
    //     else -> undefined
    //     }
    //     is SdsIntermediateRecord -> simpleReceiver.getSubstitutionByReferenceOrNull(member)
    // else -> undefined
    // }
    return undefined;
};

const simplifyReference = (
    _node: SdsReference,
    _substitutions: ParameterSubstitutions,
): SimplifiedExpression | undefined => {
    //     return when (val declaration = this.declaration) {
    //     is SdsEnumVariant -> when {
    //         declaration.parametersOrEmpty().isEmpty() -> SdsConstantEnumVariant(declaration)
    //     else -> undefined
    //     }
    //     is SdsPlaceholder -> declaration.simplifyAssignee(substitutions)
    //     is SdsParameter -> declaration.simplifyParameter(substitutions)
    //     is SdsStep -> declaration.simplifyStep()
    // else -> undefined
    // }
    return undefined;
};

// private fun SdsAbstractAssignee.simplifyAssignee(substitutions: ParameterSubstitutions): SdsSimplifiedExpression? {
//     val simpleFullAssignedExpression = closestAncestorOrNull<SdsAssignment>()
//         ?.expression
//         ?.simplify(substitutions)
//         ?: return undefined
//
//     return when (simpleFullAssignedExpression) {
//     is SdsIntermediateRecord -> simpleFullAssignedExpression.getSubstitutionByIndexOrNull(indexOrNull())
//     else -> when {
//     indexOrNull() == 0 -> simpleFullAssignedExpression
// else -> undefined
// }
// }
// }
//
// private fun SdsParameter.simplifyParameter(substitutions: ParameterSubstitutions): SdsSimplifiedExpression? {
//     return when {
//     this in substitutions -> substitutions[this]
//     isOptional() -> defaultValue?.simplify(substitutions)
// else -> undefined
// }
// }
//
// private fun SdsStep.simplifyStep(): SdsIntermediateStep? {
//     return when {
//     callableHasNoSideEffects(resultIfUnknown = true) -> SdsIntermediateStep(
//     parameters = parametersOrEmpty(),
//     results = resultsOrEmpty()
// )
// else -> undefined
// }
// }
/* c8 ignore stop */
