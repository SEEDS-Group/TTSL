import { AstUtils, ValidationAcceptor } from 'langium';
import {
    isTslDictionary,
    type TslDictionary,
} from '../generated/ast.js';
import { SafeDsServices } from '../safe-ds-module.js';

export const CODE_EXPERIMENTAL_LANGUAGE_FEATURE = 'experimental/language-feature';

export const mapsShouldBeUsedWithCaution = (services: SafeDsServices) => {
    const settingsProvider = services.workspace.SettingsProvider;

    return async (node: TslDictionary, accept: ValidationAcceptor) => {
        if (!(await settingsProvider.shouldValidateExperimentalLanguageFeature())) {
            /* c8 ignore next 2 */
            return;
        }

        // There's already a warning on the container
        if (AstUtils.hasContainerOfType(node.$container, isTslDictionary)) {
            return;
        }

        accept('warning', 'Map literals are experimental and may change without prior notice.', {
            node,
            code: CODE_EXPERIMENTAL_LANGUAGE_FEATURE,
        });
    };
};