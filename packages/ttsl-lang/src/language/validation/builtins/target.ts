import { ValidationAcceptor } from 'langium';
import {
    isTslAnnotation,
    isTslAttribute,
    isTslClass,
    isTslEnum,
    isTslEnumVariant,
    isTslFunction,
    isTslList,
    isTslModule,
    isTslParameter,
    isTslPipeline,
    isTslResult,
    isTslSegment,
    isTslTypeParameter,
    TslAnnotation,
    TslAnnotationCall,
    TslEnumVariant,
} from '../../generated/ast.js';
import { findFirstAnnotationCallOf, getAnnotationCallTarget } from '../../helpers/nodeProperties.js';
import { SafeDsServices } from '../../safe-ds-module.js';

export const CODE_TARGET_DUPLICATE_TARGET = 'target/duplicate-target';
export const CODE_TARGET_WRONG_TARGET = 'target/wrong-target';

export const targetShouldNotHaveDuplicateEntries = (services: SafeDsServices) => {
    const builtinAnnotations = services.builtins.Annotations;
    const builtinEnums = services.builtins.Enums;
    const partialEvaluator = services.evaluation.PartialEvaluator;
    const nodeMapper = services.helpers.NodeMapper;

    return (node: TslAnnotation, accept: ValidationAcceptor) => {
        const annotationCall = findFirstAnnotationCallOf(node, builtinAnnotations.Target);
        if (!annotationCall) {
            return;
        }

        const targets = nodeMapper.callToParameterValue(annotationCall, 'targets');
        if (!isTslList(targets)) {
            return;
        }

        const knownTargets = new Set<TslEnumVariant>();
        for (const target of targets.elements) {
            const evaluatedTarget = partialEvaluator.evaluate(target);
            if (!builtinEnums.isEvaluatedAnnotationTarget(evaluatedTarget)) {
                continue;
            }

            if (knownTargets.has(evaluatedTarget.variant)) {
                accept('warning', `The target '${evaluatedTarget.variant.name}' was set already.`, {
                    node: target,
                    code: CODE_TARGET_DUPLICATE_TARGET,
                });
            } else {
                knownTargets.add(evaluatedTarget.variant);
            }
        }
    };
};

export const annotationCallMustHaveCorrectTarget = (services: SafeDsServices) => {
    const builtinAnnotations = services.builtins.Annotations;

    return (node: TslAnnotationCall, accept: ValidationAcceptor) => {
        const annotation = node.annotation?.ref;
        if (!annotation) {
            return;
        }

        const actualTarget = getActualTarget(node);
        /* c8 ignore start */
        if (!actualTarget) {
            return;
        }
        /* c8 ignore stop */

        const validTargets = builtinAnnotations
            .streamValidTargets(annotation)
            .map((it) => it.name)
            .toSet();

        if (!validTargets.has(actualTarget.enumVariantName)) {
            accept('error', `The annotation '${annotation.name}' cannot be applied to ${actualTarget.prettyName}.`, {
                node,
                property: 'annotation',
                code: CODE_TARGET_WRONG_TARGET,
            });
        }
    };
};

const getActualTarget = (node: TslAnnotationCall): GetActualTargetResult | void => {
    const annotatedObject = getAnnotationCallTarget(node);

    if (isTslAnnotation(annotatedObject)) {
        return {
            enumVariantName: 'Annotation',
            prettyName: 'an annotation',
        };
    } else if (isTslAttribute(annotatedObject)) {
        return {
            enumVariantName: 'Attribute',
            prettyName: 'an attribute',
        };
    } else if (isTslClass(annotatedObject)) {
        return {
            enumVariantName: 'Class',
            prettyName: 'a class',
        };
    } else if (isTslEnum(annotatedObject)) {
        return {
            enumVariantName: 'Enum',
            prettyName: 'an enum',
        };
    } else if (isTslEnumVariant(annotatedObject)) {
        return {
            enumVariantName: 'EnumVariant',
            prettyName: 'an enum variant',
        };
    } else if (isTslFunction(annotatedObject)) {
        return {
            enumVariantName: 'Function',
            prettyName: 'a function',
        };
    } else if (isTslModule(annotatedObject)) {
        return {
            enumVariantName: 'Module',
            prettyName: 'a module',
        };
    } else if (isTslParameter(annotatedObject)) {
        return {
            enumVariantName: 'Parameter',
            prettyName: 'a parameter',
        };
    } else if (isTslPipeline(annotatedObject)) {
        return {
            enumVariantName: 'Pipeline',
            prettyName: 'a pipeline',
        };
    } else if (isTslResult(annotatedObject)) {
        return {
            enumVariantName: 'Result',
            prettyName: 'a result',
        };
    } else if (isTslSegment(annotatedObject)) {
        return {
            enumVariantName: 'Segment',
            prettyName: 'a segment',
        };
    } else if (isTslTypeParameter(annotatedObject)) {
        return {
            enumVariantName: 'TypeParameter',
            prettyName: 'a type parameter',
        };
    }
};

interface GetActualTargetResult {
    enumVariantName: string;
    prettyName: string;
}
