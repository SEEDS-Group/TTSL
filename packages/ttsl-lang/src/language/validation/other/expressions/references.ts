import {
    isTslCall,
    isTslFunction,
    isTslMemberAccess,
    TslReference,
} from '../../../generated/ast.js';
import { AstNode, ValidationAcceptor } from 'langium';

export const CODE_REFERENCE_FUNCTION_POINTER = 'reference/function-pointer';

export const referenceMustNotBeFunctionPointer = (node: TslReference, accept: ValidationAcceptor): void => {
    const target = node.target.ref;
    if (!isTslFunction(target)) {
        return;
    }

    // Get the containing member access if the node is on its right side
    let nodeOrContainer: AstNode | undefined = node;
    if (isTslMemberAccess(node.$container) && node.$containerProperty === 'member') {
        nodeOrContainer = nodeOrContainer.$container;
    }

    if (!isTslCall(nodeOrContainer?.$container)) {
        accept(
            'error',
            'Function pointers are not allowed to provide a cleaner graphical view.',
            {
                node,
                code: CODE_REFERENCE_FUNCTION_POINTER,
            },
        );
    }
};

