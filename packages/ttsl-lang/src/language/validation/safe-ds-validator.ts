import { ValidationChecks } from 'langium';
import { TTSLAstType } from '../generated/ast.js';
import type { SafeDsServices } from '../safe-ds-module.js';
import {
    argumentCorrespondingParameterShouldNotBeDeprecated,
    assigneeAssignedResultShouldNotBeDeprecated,
    referenceTargetShouldNotBeDeprecated,
    requiredParameterMustNotBeDeprecated,
} from './builtins/deprecated.js';
import {
    argumentCorrespondingParameterShouldNotBeExperimental,
    assigneeAssignedResultShouldNotBeExperimental,
    referenceTargetShouldNotExperimental,
} from './builtins/experimental.js';
import { requiredParameterMustNotBeExpert } from './builtins/expert.js';
import { pythonCallMustOnlyContainValidTemplateExpressions } from './builtins/pythonCall.js';
import { pythonModuleShouldDifferFromSafeDsPackage } from './builtins/pythonModule.js';
import {
    pythonNameMustNotBeSetIfPythonCallIsSet,
    pythonNameShouldDifferFromSafeDsName,
} from './builtins/pythonName.js';
import { singleUseAnnotationsMustNotBeRepeated } from './builtins/repeatable.js';
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
import {
    callableTypeParametersMustNotBeAnnotated,
    callableTypeResultsMustNotBeAnnotated,
} from './other/declarations/annotationCalls.js';
import { parameterListMustNotHaveRequiredParametersAfterOptionalParameters } from './other/declarations/parameterLists.js';
import {
    constantParameterMustHaveConstantDefaultValue,
    constantParameterMustHaveTypeThatCanBeEvaluatedToConstant,
} from './other/declarations/parameters.js';
import { placeholderShouldBeUsed, placeholdersMustNotBeAnAlias } from './other/declarations/placeholders.js';
import { callArgumentMustBeConstantIfParameterIsConstant, callMustNotBeRecursive } from './other/expressions/calls.js';
import { divisionDivisorMustNotBeZero } from './other/expressions/infixOperations.js';
import { memberAccessOfEnumVariantMustNotLackInstantiation } from './other/expressions/memberAccesses.js';
import {
    referenceMustNotBeFunctionPointer,
    referenceMustNotBeStaticClassOrEnumReference,
    referenceTargetMustNotBeAnnotationPipelineOrSchema,
} from './other/expressions/references.js';
import { templateStringMustHaveExpressionBetweenTwoStringParts } from './other/expressions/templateStrings.js';
import { importPackageMustExist, importPackageShouldNotBeEmpty } from './other/imports.js';
import {
    moduleDeclarationsMustMatchFileKind,
    moduleWithDeclarationsMustStatePackage,
    pipelineFileMustNotBeInBuiltinPackage,
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
    callArgumentAssignedToPureParameterMustBePure,
    impurityReasonParameterNameMustBelongToParameterOfCorrectType,
    impurityReasonShouldNotBeSetMultipleTimes,
    impurityReasonsOfOverridingMethodMustBeSubsetOfOverriddenMethod,
    pureParameterDefaultValueMustBePure,
} from './purity.js';
import {
    assignmentShouldHaveMoreThanWildcardsAsAssignees,
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
import {
    callArgumentMustRespectParameterBounds,
    parameterDefaultValueMustRespectParameterBounds,
} from './other/declarations/parameterBounds.js';
import { groupedFunctionHasAggregation, groupedFunctionHasValidID } from './aggregation.js';

/**
 * Register custom validation checks.
 */
export const registerValidationChecks = function (services: SafeDsServices) {
    const registry = services.validation.ValidationRegistry;
    const checks: ValidationChecks<TTSLAstType> = {
        TslAssignee: [
            assigneeAssignedResultShouldNotBeDeprecated(services),
            assigneeAssignedResultShouldNotBeExperimental(services),
        ],
        TslAssignment: [
            assignmentAssigneeMustGetValue(services),
            assignmentShouldNotImplicitlyIgnoreResult(services),
            assignmentShouldHaveMoreThanWildcardsAsAssignees(services),
        ],
        TslAbstractCall: [
            argumentListMustNotHaveTooManyArguments(services),
            argumentListMustSetAllRequiredParameters(services),
        ],
        TslArgument: [
            argumentCorrespondingParameterShouldNotBeDeprecated(services),
            argumentCorrespondingParameterShouldNotBeExperimental(services),
        ],
        TslArgumentList: [
            argumentListMustNotHavePositionalArgumentsAfterNamedArguments,
            argumentListMustNotSetParameterMultipleTimes(services),
        ],
        TslCall: [
            callArgumentListShouldBeNeeded(services),
            callArgumentAssignedToPureParameterMustBePure(services),
            callArgumentMustBeConstantIfParameterIsConstant(services),
            callArgumentMustRespectParameterBounds(services),
            callArgumentTypesMustMatchParameterTypes(services),
            callMustNotBeRecursive(services),
            callReceiverMustBeCallable(services),
        ],
        TslCallableType: [
            callableTypeMustBeUsedInCorrectContext,
            callableTypeMustContainUniqueNames,
            callableTypeMustNotHaveOptionalParameters,
            callableTypeParametersMustNotBeAnnotated,
            callableTypeParameterMustNotHaveConstModifier,
            callableTypeResultsMustNotBeAnnotated,
        ],
        TslChainedExpression: [
            chainedExpressionsMustBeNullSafeIfReceiverIsNullable(services),
            chainedExpressionNullSafetyShouldBeNeeded(services),
        ],
        TslDeclaration: [
            nameMustNotOccurOnCoreDeclaration(services),
            nameMustNotStartWithCodegenPrefix,
            nameShouldHaveCorrectCasing(services),
            pythonNameShouldDifferFromSafeDsName(services),
            singleUseAnnotationsMustNotBeRepeated(services),
        ],
        TslFunction: [
            functionResultListShouldNotBeEmpty(services),
            impurityReasonsOfOverridingMethodMustBeSubsetOfOverriddenMethod(services),
            impurityReasonParameterNameMustBelongToParameterOfCorrectType(services),
            impurityReasonShouldNotBeSetMultipleTimes(services),
            pythonCallMustOnlyContainValidTemplateExpressions(services),
            pythonNameMustNotBeSetIfPythonCallIsSet(services),
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
        TslMemberAccess: [memberAccessOfEnumVariantMustNotLackInstantiation],
        TslModule: [
            moduleDeclarationsMustMatchFileKind,
            moduleMemberMustHaveNameThatIsUniqueInPackage(services),
            moduleMustContainUniqueNames,
            moduleWithDeclarationsMustStatePackage,
            pipelineFileMustNotBeInBuiltinPackage,
            pythonModuleShouldDifferFromSafeDsPackage(services),
        ],
        TslParameter: [
            constantParameterMustHaveConstantDefaultValue(services),
            constantParameterMustHaveTypeThatCanBeEvaluatedToConstant(services),
            parameterMustHaveTypeHint,
            parameterDefaultValueMustRespectParameterBounds(services),
            parameterDefaultValueTypeMustMatchParameterType(services),
            pureParameterDefaultValueMustBePure(services),
            requiredParameterMustNotBeDeprecated(services),
            requiredParameterMustNotBeExpert(services),
        ],
        TslParameterList: [parameterListMustNotHaveRequiredParametersAfterOptionalParameters],
        TslPlaceholder: [placeholdersMustNotBeAnAlias, placeholderShouldBeUsed(services)],
        TslPrefixOperation: [prefixOperationOperandMustHaveCorrectType(services)],
        TslReference: [
            referenceMustNotBeFunctionPointer,
            referenceMustNotBeStaticClassOrEnumReference,
            referenceTargetMustNotBeAnnotationPipelineOrSchema,
            referenceTargetShouldNotBeDeprecated(services),
            referenceTargetShouldNotExperimental(services),
        ],
        TslResult: [resultMustHaveTypeHint],
        TslStatement: [statementMustDoSomething(services)],
        TslTemplateString: [templateStringMustHaveExpressionBetweenTwoStringParts],
        TslTypeCast: [typeCastExpressionMustHaveUnknownType(services)],
    };
    registry.register(checks);
};
