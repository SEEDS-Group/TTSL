import { ValidationAcceptor } from 'langium';
import { TslParameter } from '../../generated/ast.js';
import { Parameter } from '../../helpers/nodeProperties.js';
import { SafeDsServices } from '../../safe-ds-module.js';

export const CODE_EXPERT_TARGET_PARAMETER = 'expert/target-parameter';

export const requiredParameterMustNotBeExpert =
    (services: SafeDsServices) => (node: TslParameter, accept: ValidationAcceptor) => {
        if (Parameter.isRequired(node)) {
            if (services.builtins.Annotations.callsExpert(node)) {
                accept('error', 'An expert parameter must be optional.', {
                    node,
                    property: 'name',
                    code: CODE_EXPERT_TARGET_PARAMETER,
                });
            }
        }
    };
