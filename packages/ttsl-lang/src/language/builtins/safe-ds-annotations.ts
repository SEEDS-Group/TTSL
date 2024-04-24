import { EMPTY_STREAM, Stream, stream, URI } from 'langium';
import { resourceNameToUri } from '../../helpers/resources.js';
import {
    isTslAnnotation,
    TslAnnotatedObject,
    TslAnnotation,
    TslEnumVariant,
    TslFunction,
    TslModule,
    TslParameter,
} from '../generated/ast.js';
import { findFirstAnnotationCallOf, getEnumVariants, hasAnnotationCallOf } from '../helpers/nodeProperties.js';
import { SafeDsNodeMapper } from '../helpers/safe-ds-node-mapper.js';
import {
    EvaluatedEnumVariant,
    EvaluatedList,
    EvaluatedNode,
    StringConstant,
    UnknownEvaluatedNode,
} from '../partialEvaluation/model.js';
import { SafeDsPartialEvaluator } from '../partialEvaluation/safe-ds-partial-evaluator.js';
import { SafeDsServices } from '../safe-ds-module.js';
import { SafeDsEnums } from './safe-ds-enums.js';
import { SafeDsModuleMembers } from './safe-ds-module-members.js';

const ANNOTATION_USAGE_URI = resourceNameToUri('builtins/safeds/lang/annotationUsage.Tslstub');
const CODE_GENERATION_URI = resourceNameToUri('builtins/safeds/lang/codeGeneration.Tslstub');
const IDE_INTEGRATION_URI = resourceNameToUri('builtins/safeds/lang/ideIntegration.Tslstub');
const MATURITY_URI = resourceNameToUri('builtins/safeds/lang/maturity.Tslstub');
const PURITY_URI = resourceNameToUri('builtins/safeds/lang/purity.Tslstub');

export class SafeDsAnnotations extends SafeDsModuleMembers<TslAnnotation> {
    private readonly builtinEnums: SafeDsEnums;
    private readonly nodeMapper: SafeDsNodeMapper;
    private readonly partialEvaluator: SafeDsPartialEvaluator;

    constructor(services: SafeDsServices) {
        super(services);

        this.builtinEnums = services.builtins.Enums;
        this.nodeMapper = services.helpers.NodeMapper;
        this.partialEvaluator = services.evaluation.PartialEvaluator;
    }

    callsDeprecated(node: TslAnnotatedObject | undefined): boolean {
        return hasAnnotationCallOf(node, this.Deprecated);
    }

    private get Deprecated(): TslAnnotation | undefined {
        return this.getAnnotation(MATURITY_URI, 'Deprecated');
    }

    callsExperimental(node: TslAnnotatedObject | undefined): boolean {
        return hasAnnotationCallOf(node, this.Experimental);
    }

    private get Experimental(): TslAnnotation | undefined {
        return this.getAnnotation(MATURITY_URI, 'Experimental');
    }

    callsExpert(node: TslParameter | undefined): boolean {
        return hasAnnotationCallOf(node, this.Expert);
    }

    private get Expert(): TslAnnotation | undefined {
        return this.getAnnotation(IDE_INTEGRATION_URI, 'Expert');
    }

    callsImpure(node: TslFunction | undefined): boolean {
        return hasAnnotationCallOf(node, this.Impure);
    }

    streamImpurityReasons(node: TslFunction | undefined): Stream<EvaluatedEnumVariant> {
        // If allReasons are specified, but we could not evaluate them to a list, no reasons apply
        const value = this.getParameterValue(node, this.Impure, 'allReasons');
        if (!(value instanceof EvaluatedList)) {
            return EMPTY_STREAM;
        }

        // Otherwise, filter the elements of the list and keep only variants of the ImpurityReason enum
        return stream(value.elements).filter(this.builtinEnums.isEvaluatedImpurityReason);
    }

    get Impure(): TslAnnotation | undefined {
        return this.getAnnotation(PURITY_URI, 'Impure');
    }

    callsPure(node: TslFunction | undefined): boolean {
        return hasAnnotationCallOf(node, this.Pure);
    }

    get Pure(): TslAnnotation | undefined {
        return this.getAnnotation(PURITY_URI, 'Pure');
    }

    getPythonCall(node: TslFunction | undefined): string | undefined {
        const value = this.getParameterValue(node, this.PythonCall, 'callSpecification');
        if (value instanceof StringConstant) {
            return value.value;
        } else {
            return undefined;
        }
    }

    get PythonCall(): TslAnnotation | undefined {
        return this.getAnnotation(CODE_GENERATION_URI, 'PythonCall');
    }

    getPythonModule(node: TslModule | undefined): string | undefined {
        const value = this.getParameterValue(node, this.PythonModule, 'qualifiedName');
        if (value instanceof StringConstant) {
            return value.value;
        } else {
            return undefined;
        }
    }

    get PythonModule(): TslAnnotation | undefined {
        return this.getAnnotation(CODE_GENERATION_URI, 'PythonModule');
    }

    getPythonName(node: TslAnnotatedObject | undefined): string | undefined {
        const value = this.getParameterValue(node, this.PythonName, 'name');
        if (value instanceof StringConstant) {
            return value.value;
        } else {
            return undefined;
        }
    }

    get PythonName(): TslAnnotation | undefined {
        return this.getAnnotation(CODE_GENERATION_URI, 'PythonName');
    }

    callsRepeatable(node: TslAnnotation | undefined): boolean {
        return hasAnnotationCallOf(node, this.Repeatable);
    }

    private get Repeatable(): TslAnnotation | undefined {
        return this.getAnnotation(ANNOTATION_USAGE_URI, 'Repeatable');
    }

    streamValidTargets(node: TslAnnotation | undefined): Stream<TslEnumVariant> {
        // If no targets are specified, every target is valid
        if (!hasAnnotationCallOf(node, this.Target)) {
            return stream(getEnumVariants(this.builtinEnums.AnnotationTarget));
        }

        // If targets are specified, but we could not evaluate them to a list, no target is valid
        const value = this.getParameterValue(node, this.Target, 'targets');
        if (!(value instanceof EvaluatedList)) {
            return EMPTY_STREAM;
        }

        // Otherwise, filter the elements of the list and keep only variants of the AnnotationTarget enum
        return stream(value.elements)
            .filter(this.builtinEnums.isEvaluatedAnnotationTarget)
            .map((it) => it.variant);
    }

    get Target(): TslAnnotation | undefined {
        return this.getAnnotation(ANNOTATION_USAGE_URI, 'Target');
    }

    private getAnnotation(uri: URI, name: string): TslAnnotation | undefined {
        return this.getModuleMember(uri, name, isTslAnnotation);
    }

    /**
     * Finds the first call of the given annotation on the given node and returns the value that is assigned to the
     * parameter with the given name.
     */
    private getParameterValue(
        node: TslAnnotatedObject | undefined,
        annotation: TslAnnotation | undefined,
        parameterName: string,
    ): EvaluatedNode {
        const annotationCall = findFirstAnnotationCallOf(node, annotation);
        if (!annotationCall) {
            return UnknownEvaluatedNode;
        }

        const parameterValue = this.nodeMapper.callToParameterValue(annotationCall, parameterName);
        return this.partialEvaluator.evaluate(parameterValue);
    }
}
