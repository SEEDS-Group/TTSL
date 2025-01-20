import { ValidationChecks } from 'langium';
import { TTSLAstType } from '../generated/ast.js';
import type { TTSLServices } from '../ttsl-module.js';
import {
    moduleMemberMustHaveNameThatIsUniqueInPackage,
    moduleMustContainUniqueNames,
    nameMustNotOccurOnCoreDeclaration,
    nameMustNotStartWithCodegenPrefix,
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
    chainedExpressionNullSafetyShouldBeNeeded,
    elvisOperatorShouldBeNeeded,
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
import { indexedAccessIndexMustBeValid } from './other/expressions/indexedAccess.js';
import { chainedExpressionsMustBeNullSafeIfReceiverIsNullable } from './other/expressions/chainedExpressions.js';
import { groupByVariableMustBeASingleID, groupedFunctionHasAggregation, groupedFunctionHasValidID } from './aggregation.js';

/**
 * Register custom validation checks.
 */
export const registerValidationChecks = function (services: TTSLServices) {
    const registry = services.validation.ValidationRegistry;
    const checks: ValidationChecks<TTSLAstType> = {
        TslAbstractCall: [
            argumentListMustNotHaveTooManyArguments(services),
            argumentListMustSetAllRequiredParameters(services),
        ],
        TslArgumentList: [
            argumentListMustNotHavePositionalArgumentsAfterNamedArguments,
            argumentListMustNotSetParameterMultipleTimes(services),
        ],
        TslAggregation: [
            groupByVariableMustBeASingleID(),
        ],
        TslCall: [
            callArgumentMustBeConstantIfParameterIsConstant(services),
            callArgumentTypesMustMatchParameterTypes(services),
            callMustNotBeRecursive(services),
            callReceiverMustBeCallable(services),
        ],
        TslChainedExpression: [
            chainedExpressionsMustBeNullSafeIfReceiverIsNullable(services),
            chainedExpressionNullSafetyShouldBeNeeded(services),
        ],
        TslDeclaration: [
            nameMustNotOccurOnCoreDeclaration(services),
            nameMustNotStartWithCodegenPrefix,
        ],
        TslFunction: [
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
        TslDictionary: [mapMustNotContainNamedTuples(services)],
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
        TslTemplateString: [templateStringMustHaveExpressionBetweenTwoStringParts],
        TslTypeCast: [typeCastExpressionMustHaveUnknownType(services)],
    };
    registry.register(checks);
};
