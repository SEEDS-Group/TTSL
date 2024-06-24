import { ValidationAcceptor } from 'langium';
import {
    isTslParameter,
    isTslResult,
    TslArgument,
    TslAssignee,
    TslReference,
} from '../../generated/ast.js';
import { SafeDsServices } from '../../safe-ds-module.js';

export const CODE_EXPERIMENTAL_LIBRARY_ELEMENT = 'experimental/library-element';

export const assigneeAssignedResultShouldNotBeExperimental = (services: SafeDsServices) => {
    const settingsProvider = services.workspace.SettingsProvider;

    return async (node: TslAssignee, accept: ValidationAcceptor) => {
        if (!(await settingsProvider.shouldValidateExperimentalLibraryElement())) {
            /* c8 ignore next 2 */
            return;
        }

        const assignedObject = services.helpers.NodeMapper.assigneeToAssignedObject(node);
        if (!isTslResult(assignedObject)) {
            return;
        }

        if (services.builtins.Annotations.callsExperimental(assignedObject)) {
            accept('warning', `The assigned result '${assignedObject.name}' is experimental.`, {
                node,
                code: CODE_EXPERIMENTAL_LIBRARY_ELEMENT,
            });
        }
    };
};

export const argumentCorrespondingParameterShouldNotBeExperimental = (services: SafeDsServices) => {
    const settingsProvider = services.workspace.SettingsProvider;

    return async (node: TslArgument, accept: ValidationAcceptor) => {
        if (!(await settingsProvider.shouldValidateExperimentalLibraryElement())) {
            /* c8 ignore next 2 */
            return;
        }

        const parameter = services.helpers.NodeMapper.argumentToParameter(node);
        if (!parameter) {
            return;
        }

        if (services.builtins.Annotations.callsExperimental(parameter)) {
            accept('warning', `The corresponding parameter '${parameter.name}' is experimental.`, {
                node,
                code: CODE_EXPERIMENTAL_LIBRARY_ELEMENT,
            });
        }
    };
};

export const referenceTargetShouldNotExperimental = (services: SafeDsServices) => {
    const settingsProvider = services.workspace.SettingsProvider;

    return async (node: TslReference, accept: ValidationAcceptor) => {
        if (!(await settingsProvider.shouldValidateExperimentalLibraryElement())) {
            /* c8 ignore next 2 */
            return;
        }

        const target = node.target.ref;
        if (!target || isTslParameter(target)) {
            return;
        }

        if (services.builtins.Annotations.callsExperimental(target)) {
            accept('warning', `The referenced declaration '${target.name}' is experimental.`, {
                node,
                code: CODE_EXPERIMENTAL_LIBRARY_ELEMENT,
            });
        }
    };
};
