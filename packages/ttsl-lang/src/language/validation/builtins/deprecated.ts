import { ValidationAcceptor } from 'langium';
import { DiagnosticTag } from 'vscode-languageserver';
import {
    isTslParameter,
    isTslResult,
    TslArgument,
    TslAssignee,
    TslParameter,
    TslReference,
} from '../../generated/ast.js';
import { Parameter } from '../../helpers/nodeProperties.js';
import { SafeDsServices } from '../../safe-ds-module.js';
import { parameterCanBeAnnotated } from '../other/declarations/annotationCalls.js';

export const CODE_DEPRECATED_LIBRARY_ELEMENT = 'deprecated/library-element';
export const CODE_DEPRECATED_REQUIRED_PARAMETER = 'deprecated/required-parameter';

export const assigneeAssignedResultShouldNotBeDeprecated =
    (services: SafeDsServices) => (node: TslAssignee, accept: ValidationAcceptor) => {
        const assignedObject = services.helpers.NodeMapper.assigneeToAssignedObject(node);
        if (!isTslResult(assignedObject)) {
            return;
        }

        if (services.builtins.Annotations.callsDeprecated(assignedObject)) {
            accept('warning', `The assigned result '${assignedObject.name}' is deprecated.`, {
                node,
                code: CODE_DEPRECATED_LIBRARY_ELEMENT,
                tags: [DiagnosticTag.Deprecated],
            });
        }
    };

export const argumentCorrespondingParameterShouldNotBeDeprecated =
    (services: SafeDsServices) => (node: TslArgument, accept: ValidationAcceptor) => {
        const parameter = services.helpers.NodeMapper.argumentToParameter(node);
        if (!parameter) {
            return;
        }

        if (services.builtins.Annotations.callsDeprecated(parameter)) {
            accept('warning', `The corresponding parameter '${parameter.name}' is deprecated.`, {
                node,
                code: CODE_DEPRECATED_LIBRARY_ELEMENT,
                tags: [DiagnosticTag.Deprecated],
            });
        }
    };

export const referenceTargetShouldNotBeDeprecated =
    (services: SafeDsServices) => (node: TslReference, accept: ValidationAcceptor) => {
        const target = node.target.ref;
        if (!target || isTslParameter(target)) {
            return;
        }

        if (services.builtins.Annotations.callsDeprecated(target)) {
            accept('warning', `The referenced declaration '${target.name}' is deprecated.`, {
                node,
                code: CODE_DEPRECATED_LIBRARY_ELEMENT,
                tags: [DiagnosticTag.Deprecated],
            });
        }
    };

export const requiredParameterMustNotBeDeprecated =
    (services: SafeDsServices) => (node: TslParameter, accept: ValidationAcceptor) => {
        if (Parameter.isRequired(node) && parameterCanBeAnnotated(node)) {
            if (services.builtins.Annotations.callsDeprecated(node)) {
                accept('error', 'A deprecated parameter must be optional.', {
                    node,
                    property: 'name',
                    code: CODE_DEPRECATED_REQUIRED_PARAMETER,
                });
            }
        }
    };
