import { isTslCall, isTslEnumVariant, TslMemberAccess } from '../../../generated/ast.js';
import { ValidationAcceptor } from 'langium';
import { getParameters } from '../../../helpers/nodeProperties.js';
import { isEmpty } from '../../../../helpers/collections.js';

export const CODE_MEMBER_ACCESS_MISSING_ENUM_VARIANT_INSTANTIATION = 'member-access/missing-enum-variant-instantiation';

export const memberAccessOfEnumVariantMustNotLackInstantiation = (
    node: TslMemberAccess,
    accept: ValidationAcceptor,
): void => {
    const declaration = node.member?.target?.ref;
    if (!isTslEnumVariant(declaration)) {
        return;
    }

    if (!isTslCall(node.$container) && !isEmpty(getParameters(declaration))) {
        accept('error', `The enum variant '${declaration.name}' has parameters, so an argument list must be added.`, {
            node,
            property: 'member',
            code: CODE_MEMBER_ACCESS_MISSING_ENUM_VARIANT_INSTANTIATION,
        });
    }
};
