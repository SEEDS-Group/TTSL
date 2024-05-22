import {
    isTslAnnotation,
    isTslCall,
    isTslClass,
    isTslEnum,
    isTslFunction,
    isTslMemberAccess,
    isTslPipeline,
    isTslSchema,
    isTslSegment,
    TslReference,
} from '../../../generated/ast.js';
import { AstNode, ValidationAcceptor } from 'langium';

export const CODE_REFERENCE_FUNCTION_POINTER = 'reference/function-pointer';
export const CODE_REFERENCE_STATIC_CLASS_REFERENCE = 'reference/static-class-reference';
export const CODE_REFERENCE_STATIC_ENUM_REFERENCE = 'reference/static-enum-reference';
export const CODE_REFERENCE_TARGET = 'reference/target';

export const referenceMustNotBeFunctionPointer = (node: TslReference, accept: ValidationAcceptor): void => {
    const target = node.target.ref;
    if (!isTslFunction(target) && !isTslSegment(target)) {
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
            'Function pointers are not allowed to provide a cleaner graphical view. Use a lambda instead.',
            {
                node,
                code: CODE_REFERENCE_FUNCTION_POINTER,
            },
        );
    }
};

export const referenceMustNotBeStaticClassOrEnumReference = (node: TslReference, accept: ValidationAcceptor) => {
    const target = node.target.ref;
    if (!isTslClass(target) && !isTslEnum(target)) {
        return;
    }

    // Get the containing member access if the node is on its right side
    let nodeOrContainer: AstNode | undefined = node;
    if (isTslMemberAccess(node.$container) && node.$containerProperty === 'member') {
        nodeOrContainer = nodeOrContainer.$container;
    }

    // Access to a member of the class or enum
    if (isTslMemberAccess(nodeOrContainer?.$container) && nodeOrContainer?.$containerProperty === 'receiver') {
        return;
    }

    // Call of the class or enum
    if (isTslCall(nodeOrContainer?.$container)) {
        return;
    }

    // Static reference to the class or enum
    if (isTslClass(target)) {
        accept('error', 'A class must not be statically referenced.', {
            node,
            code: CODE_REFERENCE_STATIC_CLASS_REFERENCE,
        });
    } else if (isTslEnum(target)) {
        accept('error', 'An enum must not be statically referenced.', {
            node,
            code: CODE_REFERENCE_STATIC_ENUM_REFERENCE,
        });
    }
};

export const referenceTargetMustNotBeAnnotationPipelineOrSchema = (
    node: TslReference,
    accept: ValidationAcceptor,
): void => {
    const target = node.target.ref;

    if (isTslAnnotation(target)) {
        accept('error', 'An annotation must not be the target of a reference.', {
            node,
            code: CODE_REFERENCE_TARGET,
        });
    } else if (isTslPipeline(target)) {
        accept('error', 'A pipeline must not be the target of a reference.', {
            node,
            code: CODE_REFERENCE_TARGET,
        });
    } else if (isTslSchema(target)) {
        accept('error', 'A schema must not be the target of a reference.', {
            node,
            code: CODE_REFERENCE_TARGET,
        });
    }
};
