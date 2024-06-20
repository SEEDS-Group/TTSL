import { ValidationChecks } from 'langium';
import { TTSLAstType } from '../generated/ast.js';
import type { SafeDsServices } from '../safe-ds-module.js';
import {
    annotationCallAnnotationShouldNotBeDeprecated,
    argumentCorrespondingParameterShouldNotBeDeprecated,
    assigneeAssignedResultShouldNotBeDeprecated,
    namedTypeDeclarationShouldNotBeDeprecated,
    referenceTargetShouldNotBeDeprecated,
    requiredParameterMustNotBeDeprecated,
} from './builtins/deprecated.js';
import {
    annotationCallAnnotationShouldNotBeExperimental,
    argumentCorrespondingParameterShouldNotBeExperimental,
    assigneeAssignedResultShouldNotBeExperimental,
    namedTypeDeclarationShouldNotBeExperimental,
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
import { annotationCallMustHaveCorrectTarget, targetShouldNotHaveDuplicateEntries } from './builtins/target.js';
import {
    constraintListsShouldBeUsedWithCaution,
    literalTypesShouldBeUsedWithCaution,
    mapsShouldBeUsedWithCaution,
    unionTypesShouldBeUsedWithCaution,
} from './experimentalLanguageFeatures.js';
import {
    classMemberMustMatchOverriddenMemberAndShouldBeNeeded,
    classMustNotInheritItself,
    classMustOnlyInheritASingleClass,
} from './inheritance.js';
import {
    annotationMustContainUniqueNames,
    blockLambdaMustContainUniqueNames,
    callableTypeMustContainUniqueNames,
    classMustContainUniqueNames,
    enumMustContainUniqueNames,
    enumVariantMustContainUniqueNames,
    expressionLambdaMustContainUniqueNames,
    moduleMemberMustHaveNameThatIsUniqueInPackage,
    moduleMustContainUniqueNames,
    nameMustNotOccurOnCoreDeclaration,
    nameMustNotStartWithCodegenPrefix,
    nameShouldHaveCorrectCasing,
    pipelineMustContainUniqueNames,
    schemaMustContainUniqueNames,
    segmentMustContainUniqueNames,
} from './names.js';
import {
    argumentListMustNotHavePositionalArgumentsAfterNamedArguments,
    argumentListMustNotHaveTooManyArguments,
    argumentListMustNotSetParameterMultipleTimes,
    argumentListMustSetAllRequiredParameters,
} from './other/argumentLists.js';
import {
    annotationCallArgumentsMustBeConstant,
    annotationCallMustNotLackArgumentList,
    callableTypeParametersMustNotBeAnnotated,
    callableTypeResultsMustNotBeAnnotated,
    lambdaParametersMustNotBeAnnotated,
} from './other/declarations/annotationCalls.js';
import { parameterListMustNotHaveRequiredParametersAfterOptionalParameters } from './other/declarations/parameterLists.js';
import {
    constantParameterMustHaveConstantDefaultValue,
    constantParameterMustHaveTypeThatCanBeEvaluatedToConstant,
} from './other/declarations/parameters.js';
import { placeholderShouldBeUsed, placeholdersMustNotBeAnAlias } from './other/declarations/placeholders.js';
import {
    segmentParameterShouldBeUsed,
    segmentResultMustBeAssignedExactlyOnce,
    segmentShouldBeUsed,
} from './other/declarations/segments.js';
import {
    typeParameterMustBeUsedInCorrectPosition,
    typeParameterMustHaveSufficientContext,
    typeParameterMustOnlyBeVariantOnClass,
    typeParameterUpperBoundMustBeNamedType,
} from './other/declarations/typeParameters.js';
import { callArgumentMustBeConstantIfParameterIsConstant, callMustNotBeRecursive } from './other/expressions/calls.js';
import { divisionDivisorMustNotBeZero } from './other/expressions/infixOperations.js';
import {
    lambdaMustBeAssignedToTypedParameter,
    lambdaParameterMustNotHaveConstModifier,
} from './other/expressions/lambdas.js';
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
    yieldMustNotBeUsedInPipeline,
} from './other/statements/assignments.js';
import {
    callableTypeMustBeUsedInCorrectContext,
    callableTypeMustNotHaveOptionalParameters,
    callableTypeParameterMustNotHaveConstModifier,
} from './other/types/callableTypes.js';
import {
    literalTypeMustHaveLiterals,
    literalTypeMustNotContainListLiteral,
    literalTypeMustNotContainMapLiteral,
    literalTypeShouldNotHaveDuplicateLiteral,
} from './other/types/literalTypes.js';
import {
    namedTypeMustNotHaveTooManyTypeArguments,
    namedTypeMustNotSetTypeParameterMultipleTimes,
    namedTypeTypeArgumentListMustNotHavePositionalArgumentsAfterNamedArguments,
} from './other/types/namedTypes.js';
import {
    unionTypeMustBeUsedInCorrectContext,
    unionTypeMustHaveTypes,
    unionTypeShouldNotHaveDuplicateTypes,
} from './other/types/unionTypes.js';
import {
    callArgumentAssignedToPureParameterMustBePure,
    impurityReasonParameterNameMustBelongToParameterOfCorrectType,
    impurityReasonShouldNotBeSetMultipleTimes,
    impurityReasonsOfOverridingMethodMustBeSubsetOfOverriddenMethod,
    pureParameterDefaultValueMustBePure,
} from './purity.js';
import {
    annotationCallArgumentListShouldBeNeeded,
    annotationParameterListShouldNotBeEmpty,
    annotationParameterShouldNotHaveConstModifier,
    assignmentShouldHaveMoreThanWildcardsAsAssignees,
    callArgumentListShouldBeNeeded,
    chainedExpressionNullSafetyShouldBeNeeded,
    classBodyShouldNotBeEmpty,
    constraintListShouldNotBeEmpty,
    elvisOperatorShouldBeNeeded,
    enumBodyShouldNotBeEmpty,
    enumVariantParameterListShouldNotBeEmpty,
    functionResultListShouldNotBeEmpty,
    importedDeclarationAliasShouldDifferFromDeclarationName,
    namedTypeTypeArgumentListShouldBeNeeded,
    segmentResultListShouldNotBeEmpty,
    typeParameterListShouldNotBeEmpty,
    unionTypeShouldNotHaveASingularTypeArgument,
} from './style.js';
import {
    attributeMustHaveTypeHint,
    callArgumentTypesMustMatchParameterTypes,
    callReceiverMustBeCallable,
    indexedAccessIndexMustHaveCorrectType,
    indexedAccessReceiverMustBeListOrMap,
    infixOperationOperandsMustHaveCorrectType,
    listMustNotContainNamedTuples,
    mapMustNotContainNamedTuples,
    namedTypeMustSetAllTypeParameters,
    namedTypeTypeArgumentsMustMatchBounds,
    parameterDefaultValueTypeMustMatchParameterType,
    parameterMustHaveTypeHint,
    prefixOperationOperandMustHaveCorrectType,
    resultMustHaveTypeHint,
    typeCastExpressionMustHaveUnknownType,
    typeParameterDefaultValueMustMatchUpperBound,
    yieldTypeMustMatchResultType,
} from './types.js';
import { statementMustDoSomething } from './other/statements/statements.js';
import { indexedAccessIndexMustBeValid } from './other/expressions/indexedAccess.js';
import { typeParameterListMustNotHaveRequiredTypeParametersAfterOptionalTypeParameters } from './other/declarations/typeParameterLists.js';
import { chainedExpressionsMustBeNullSafeIfReceiverIsNullable } from './other/expressions/chainedExpressions.js';
import {
    callArgumentMustRespectParameterBounds,
    parameterBoundParameterMustBeConstFloatOrInt,
    parameterBoundRightOperandMustEvaluateToFloatConstantOrIntConstant,
    parameterDefaultValueMustRespectParameterBounds,
} from './other/declarations/parameterBounds.js';
import { groupByVariableMustBeAnID, groupedFunctionHasAggregation, groupedFunctionHasValidID } from './aggregation.js';

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
        TslAnnotation: [
            annotationMustContainUniqueNames,
            annotationParameterListShouldNotBeEmpty(services),
            annotationParameterShouldNotHaveConstModifier(services),
            targetShouldNotHaveDuplicateEntries(services),
        ],
        TslAnnotationCall: [
            annotationCallAnnotationShouldNotBeDeprecated(services),
            annotationCallAnnotationShouldNotBeExperimental(services),
            annotationCallArgumentListShouldBeNeeded(services),
            annotationCallArgumentsMustBeConstant(services),
            annotationCallMustHaveCorrectTarget(services),
            annotationCallMustNotLackArgumentList,
        ],
        TslArgument: [
            argumentCorrespondingParameterShouldNotBeDeprecated(services),
            argumentCorrespondingParameterShouldNotBeExperimental(services),
        ],
        TslArgumentList: [
            argumentListMustNotHavePositionalArgumentsAfterNamedArguments,
            argumentListMustNotSetParameterMultipleTimes(services),
        ],
        TslAttribute: [attributeMustHaveTypeHint],
        TslAggregation: [
            groupByVariableMustBeAnID(),
        ],
        TslBlockLambda: [blockLambdaMustContainUniqueNames],
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
        TslClass: [
            classMustContainUniqueNames,
            classMustOnlyInheritASingleClass(services),
            classMustNotInheritItself(services),
        ],
        TslClassBody: [classBodyShouldNotBeEmpty(services)],
        TslClassMember: [classMemberMustMatchOverriddenMemberAndShouldBeNeeded(services)],
        TslConstraintList: [constraintListsShouldBeUsedWithCaution(services), constraintListShouldNotBeEmpty(services)],
        TslDeclaration: [
            nameMustNotOccurOnCoreDeclaration(services),
            nameMustNotStartWithCodegenPrefix,
            nameShouldHaveCorrectCasing(services),
            pythonNameShouldDifferFromSafeDsName(services),
            singleUseAnnotationsMustNotBeRepeated(services),
        ],
        TslEnum: [enumMustContainUniqueNames],
        TslEnumBody: [enumBodyShouldNotBeEmpty(services)],
        TslEnumVariant: [enumVariantMustContainUniqueNames, enumVariantParameterListShouldNotBeEmpty(services)],
        TslExpressionLambda: [expressionLambdaMustContainUniqueNames],
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
        TslLambda: [
            lambdaMustBeAssignedToTypedParameter(services),
            lambdaParametersMustNotBeAnnotated,
            lambdaParameterMustNotHaveConstModifier,
        ],
        TslList: [listMustNotContainNamedTuples(services)],
        TslLiteralType: [
            literalTypeMustHaveLiterals,
            literalTypeMustNotContainListLiteral,
            literalTypeMustNotContainMapLiteral,
            literalTypesShouldBeUsedWithCaution(services),
            literalTypeShouldNotHaveDuplicateLiteral(services),
        ],
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
        TslNamedType: [
            namedTypeDeclarationShouldNotBeDeprecated(services),
            namedTypeDeclarationShouldNotBeExperimental(services),
            namedTypeMustNotHaveTooManyTypeArguments,
            namedTypeMustNotSetTypeParameterMultipleTimes(services),
            namedTypeMustSetAllTypeParameters(services),
            namedTypeTypeArgumentListShouldBeNeeded(services),
            namedTypeTypeArgumentListMustNotHavePositionalArgumentsAfterNamedArguments,
            namedTypeTypeArgumentsMustMatchBounds(services),
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
        TslParameterBound: [
            parameterBoundParameterMustBeConstFloatOrInt(services),
            parameterBoundRightOperandMustEvaluateToFloatConstantOrIntConstant(services),
        ],
        TslParameterList: [parameterListMustNotHaveRequiredParametersAfterOptionalParameters],
        TslPipeline: [pipelineMustContainUniqueNames],
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
        TslSchema: [schemaMustContainUniqueNames],
        TslSegment: [
            segmentMustContainUniqueNames,
            segmentParameterShouldBeUsed(services),
            segmentResultMustBeAssignedExactlyOnce(services),
            segmentResultListShouldNotBeEmpty(services),
            segmentShouldBeUsed(services),
        ],
        TslStatement: [statementMustDoSomething(services)],
        TslTemplateString: [templateStringMustHaveExpressionBetweenTwoStringParts],
        TslTypeCast: [typeCastExpressionMustHaveUnknownType(services)],
        TslTypeParameter: [
            typeParameterDefaultValueMustMatchUpperBound(services),
            typeParameterMustBeUsedInCorrectPosition(services),
            typeParameterMustHaveSufficientContext,
            typeParameterMustOnlyBeVariantOnClass,
            typeParameterUpperBoundMustBeNamedType(services),
        ],
        TslTypeParameterList: [
            typeParameterListMustNotHaveRequiredTypeParametersAfterOptionalTypeParameters,
            typeParameterListShouldNotBeEmpty(services),
        ],
        TslUnionType: [
            unionTypeMustBeUsedInCorrectContext,
            unionTypeMustHaveTypes,
            unionTypesShouldBeUsedWithCaution(services),
            unionTypeShouldNotHaveDuplicateTypes(services),
            unionTypeShouldNotHaveASingularTypeArgument(services),
        ],
        TslYield: [yieldMustNotBeUsedInPipeline, yieldTypeMustMatchResultType(services)],
    };
    registry.register(checks);
};
