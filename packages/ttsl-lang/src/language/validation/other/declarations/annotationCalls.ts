import { AstUtils, ValidationAcceptor } from 'langium';
import { isEmpty } from '../../../../helpers/collections.js';
import {
    isTslCallable,
    isTslCallableType,
    TslCallableType,
    TslParameter,
} from '../../../generated/ast.js';
import {
    getAnnotationCalls,
    getArguments,
    getParameters,
    getResults,
    Parameter,
} from '../../../helpers/nodeProperties.js';

export const CODE_ANNOTATION_CALL_TARGET_PARAMETER = 'annotation-call/target-parameter';
export const CODE_ANNOTATION_CALL_TARGET_RESULT = 'annotation-call/target-result';

export const callableTypeParametersMustNotBeAnnotated = (node: TslCallableType, accept: ValidationAcceptor) => {
    for (const parameter of getParameters(node)) {
        for (const annotationCall of getAnnotationCalls(parameter)) {
            accept('error', 'Parameters of callable types must not be annotated.', {
                node: annotationCall,
                code: CODE_ANNOTATION_CALL_TARGET_PARAMETER,
            });
        }
    }
};

export const callableTypeResultsMustNotBeAnnotated = (node: TslCallableType, accept: ValidationAcceptor) => {
    for (const result of getResults(node.resultList)) {
        for (const annotationCall of getAnnotationCalls(result)) {
            accept('error', 'Results of callable types must not be annotated.', {
                node: annotationCall,
                code: CODE_ANNOTATION_CALL_TARGET_RESULT,
            });
        }
    }
};

export const parameterCanBeAnnotated = (node: TslParameter) => {
    const containingCallable = AstUtils.getContainerOfType(node, isTslCallable);
    return !isTslCallableType(containingCallable);
};
