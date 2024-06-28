import { ValidationChecks } from 'langium';
import { TTSLAstType } from '../generated/ast.js';
import type { SafeDsServices } from '../safe-ds-module.js';
import {    
    mapsShouldBeUsedWithCaution,
} from './experimentalLanguageFeatures.js';
import {
    callableTypeMustContainUniqueNames,
    moduleMemberMustHaveNameThatIsUniqueInPackage,
    moduleMustContainUniqueNames,
    nameMustNotOccurOnCoreDeclaration,
    nameMustNotStartWithCodegenPrefix,
    nameShouldHaveCorrectCasing,
} from './names.js';
import {
    argumentListMustNotHavePositionalArgumentsAfterNamedArguments,
    argumentListMustNotHaveTooManyArguments,
    argumentListMustNotSetParameterMultipleTimes,
    argumentListMustSetAllRequiredParameters,
} from './other/argumentLists.js';
import { parameterListMustNotHaveRequiredParametersAfterOptionalParameters } from './other/declarations/parameterLists.js';
import {
    constantParameterMustHaveConstantDefaultValue,
    constantParameterMustHaveTypeThatCanBeEvaluatedToConstant,
} from './other/declarations/parameters.js';
import { placeholderShouldBeUsed, placeholdersMustNotBeAnAlias } from './other/declarations/placeholders.js';
import { callArgumentMustBeConstantIfParameterIsConstant, callMustNotBeRecursive } from './other/expressions/calls.js';
import { divisionDivisorMustNotBeZero } from './other/expressions/infixOperations.js';
import {
    referenceMustNotBeFunctionPointer,
} from './other/expressions/references.js';
import { templateStringMustHaveExpressionBetweenTwoStringParts } from './other/expressions/templateStrings.js';
import { importPackageMustExist, importPackageShouldNotBeEmpty } from './other/imports.js';
import {
    moduleWithDeclarationsMustStatePackage,
} from './other/modules.js';
import {
    assignmentAssigneeMustGetValue,
    assignmentShouldNotImplicitlyIgnoreResult,
} from './other/statements/assignments.js';
import {
    callableTypeMustBeUsedInCorrectContext,
    callableTypeMustNotHaveOptionalParameters,
    callableTypeParameterMustNotHaveConstModifier,
} from './other/types/callableTypes.js';
import {
    callArgumentListShouldBeNeeded,
    chainedExpressionNullSafetyShouldBeNeeded,
    elvisOperatorShouldBeNeeded,
    functionResultListShouldNotBeEmpty,
    importedDeclarationAliasShouldDifferFromDeclarationName,
} from './style.js';
import {
    callArgumentTypesMustMatchParameterTypes,
    callReceiverMustBeCallable,
    indexedAccessIndexMustHaveCorrectType,
    indexedAccessReceiverMustBeListOrMap,
    infixOperationOperandsMustHaveCorrectType,
    listMustNotContainNamedTuples,
    mapMustNotContainNamedTuples,
    parameterDefaultValueTypeMustMatchParameterType,
    parameterMustHaveTypeHint,
    prefixOperationOperandMustHaveCorrectType,
    resultMustHaveTypeHint,
    typeCastExpressionMustHaveUnknownType,
} from './types.js';
import { statementMustDoSomething } from './other/statements/statements.js';
import { indexedAccessIndexMustBeValid } from './other/expressions/indexedAccess.js';
import { chainedExpressionsMustBeNullSafeIfReceiverIsNullable } from './other/expressions/chainedExpressions.js';
import { groupByVariableMustBeAnID, groupedFunctionHasAggregation, groupedFunctionHasValidID } from './aggregation.js';

/**
 * Register custom validation checks.
 */
export const registerValidationChecks = function (services: SafeDsServices) {
    const registry = services.validation.ValidationRegistry;
    const checks: ValidationChecks<TTSLAstType> = {
        TslAssignee: [
        ],
        TslAssignment: [
            assignmentAssigneeMustGetValue(services),
            assignmentShouldNotImplicitlyIgnoreResult(services),
        ],
        TslAbstractCall: [
            argumentListMustNotHaveTooManyArguments(services),
            argumentListMustSetAllRequiredParameters(services),
        ],
        TslArgument: [
        ],
        TslArgumentList: [
            argumentListMustNotHavePositionalArgumentsAfterNamedArguments,
            argumentListMustNotSetParameterMultipleTimes(services),
        ],
        TslAggregation: [
            groupByVariableMustBeAnID(),
        ],
        TslCall: [
            callArgumentListShouldBeNeeded(services),
            callArgumentMustBeConstantIfParameterIsConstant(services),
            callArgumentTypesMustMatchParameterTypes(services),
            callMustNotBeRecursive(services),
            callReceiverMustBeCallable(services),
        ],
        TslCallableType: [
            callableTypeMustBeUsedInCorrectContext,
            callableTypeMustContainUniqueNames,
            callableTypeMustNotHaveOptionalParameters,
            callableTypeParameterMustNotHaveConstModifier,
        ],
        TslChainedExpression: [
            chainedExpressionsMustBeNullSafeIfReceiverIsNullable(services),
            chainedExpressionNullSafetyShouldBeNeeded(services),
        ],
        TslDeclaration: [
            nameMustNotOccurOnCoreDeclaration(services),
            nameMustNotStartWithCodegenPrefix,
            nameShouldHaveCorrectCasing(services),
        ],
        TslFunction: [
            functionResultListShouldNotBeEmpty(services),
            groupedFunctionHasAggregation(),
            groupedFunctionHasValidID(),
        ],
        TslImport: [importPackageMustExist(services), importPackageShouldNotBeEmpty(services)],
        TslImportedDeclaration: [importedDeclarationAliasShouldDifferFromDeclarationName(services)],
        TslIndexedAccess: [
            indexedAccessIndexMustBeValid(services),
            indexedAccessIndexMustHaveCorrectType(services),
            indexedAccessReceiverMustBeListOrMap(services),
        ],
        TslInfixOperation: [
            divisionDivisorMustNotBeZero(services),
            elvisOperatorShouldBeNeeded(services),
            infixOperationOperandsMustHaveCorrectType(services),
        ],
        TslList: [listMustNotContainNamedTuples(services)],
        TslDictionary: [mapMustNotContainNamedTuples(services), mapsShouldBeUsedWithCaution(services)],
        TslModule: [
            moduleMemberMustHaveNameThatIsUniqueInPackage(services),
            moduleMustContainUniqueNames,
            moduleWithDeclarationsMustStatePackage,
        ],
        TslParameter: [
            constantParameterMustHaveConstantDefaultValue(services),
            constantParameterMustHaveTypeThatCanBeEvaluatedToConstant(services),
            parameterMustHaveTypeHint,
            parameterDefaultValueTypeMustMatchParameterType(services),
        ],
        TslParameterList: [parameterListMustNotHaveRequiredParametersAfterOptionalParameters],
        TslPlaceholder: [placeholdersMustNotBeAnAlias, placeholderShouldBeUsed(services)],
        TslPrefixOperation: [prefixOperationOperandMustHaveCorrectType(services)],
        TslReference: [
            referenceMustNotBeFunctionPointer,
        ],
        TslResult: [resultMustHaveTypeHint],
        TslStatement: [statementMustDoSomething(services)],
        TslTemplateString: [templateStringMustHaveExpressionBetweenTwoStringParts],
        TslTypeCast: [typeCastExpressionMustHaveUnknownType(services)],
    };
    registry.register(checks);
};
