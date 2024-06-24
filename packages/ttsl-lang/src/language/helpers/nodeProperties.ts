import { AstNode, AstUtils, Stream, stream } from 'langium';
import {
    isTslArgument,
    isTslArgumentList,
    isTslAssignment,
    isTslCallable,
    isTslCallableType,
    isTslDeclaration,
    isTslFunction,
    isTslModule,
    isTslModuleMember,
    isTslParameter,
    isTslPlaceholder,
    isTslQualifiedImport,
    TslAbstractCall,
    TslArgument,
    TslArgumentList,
    TslAssignee,
    TslAssignment,
    TslBlock,
    TslCallable,
    TslDeclaration,
    TslImport,
    TslImportedDeclaration,
    TslModule,
    TslModuleMember,
    TslParameter,
    TslPlaceholder,
    TslQualifiedImport,
    TslResult,
    TslStatement,
} from '../generated/ast.js';

// -------------------------------------------------------------------------------------------------
// Checks
// -------------------------------------------------------------------------------------------------

export const isPackagePrivate = (node: TslModuleMember | undefined): boolean => {
    return (node?.visibility?.visibility == 'packageprivate');
};

export const isPrivate = (node: TslModuleMember | undefined): boolean => {
    return (node?.visibility?.visibility == 'private');
};

export namespace Argument {
    export const isNamed = (node: TslArgument | undefined): boolean => {
        return Boolean(node?.parameter);
    };

    export const isPositional = (node: TslArgument | undefined): boolean => {
        return isTslArgument(node) && !node.parameter;
    };
}

export namespace Parameter {
    export const isConstant = (node: TslParameter | undefined): boolean => {
        if (!node) {
            return false;
        }

        const containingCallable = AstUtils.getContainerOfType(node, isTslCallable);

        // In those cases, the const modifier is not applicable
        if (isTslCallableType(containingCallable)) {
            return false;
        }

        return node.isConstant;
    };

    export const isOptional = (node: TslParameter | undefined): boolean => {
        return Boolean(node?.defaultValue);
    };

    export const isRequired = (node: TslParameter | undefined): boolean => {
        return isTslParameter(node) && !node.defaultValue;
    };
}

// -------------------------------------------------------------------------------------------------
// Accessors for list elements
// -------------------------------------------------------------------------------------------------

export const getResults = (node: TslCallable | undefined): TslResult[] => {
    if (!node) {
        return [];
    }

    if (isTslCallableType(node)) {
        return node.resultList.results ?? [];
    } else if (isTslFunction(node) && node.result) {
        return [node.result];
    }/* c8 ignore start */ else {
        return [];
    } /* c8 ignore stop */
};

export const getArguments = (node: TslArgumentList | TslAbstractCall | undefined): TslArgument[] => {
    if (isTslArgumentList(node)) {
        return node.arguments;
    } else {
        return node?.argumentList?.arguments ?? [];
    }
};

export const getAssignees = (node: TslAssignment | undefined): TslAssignee[] => {
    return node?.assigneeList?.assignees ?? [];
};

export const getImports = (node: TslModule | undefined): TslImport[] => {
    return node?.imports ?? [];
};

export const getImportedDeclarations = (node: TslModule | TslQualifiedImport | undefined): TslImportedDeclaration[] => {
    if (isTslModule(node)) {
        return getImports(node).flatMap((imp) => {
            if (isTslQualifiedImport(imp)) {
                return getImportedDeclarations(imp);
            } else {
                return [];
            }
        });
    } else {
        return node?.importedDeclarationList?.importedDeclarations ?? [];
    }
};

export const getModuleMembers = (node: TslModule | undefined): TslModuleMember[] => {
    return node?.members?.filter(isTslModuleMember) ?? [];
};

export const getPackageName = (node: AstNode | undefined): string | undefined => {
    return AstUtils.getContainerOfType(node, isTslModule)?.name;
};

export const getParameters = (node: TslCallable | undefined): TslParameter[] => {
    return node?.parameterList?.parameters ?? [];
};

export const getQualifiedName = (node: TslDeclaration | undefined): string | undefined => {
    const segments = [];

    let current: TslDeclaration | undefined = node;
    while (current) {
        if (current.name) {
            segments.unshift(current.name);
        }
        current = AstUtils.getContainerOfType(current.$container, isTslDeclaration);
    }

    return segments.join('.');
};

export const streamPlaceholders = (node: TslBlock | undefined): Stream<TslPlaceholder> => {
    return stream(getStatements(node)).filter(isTslAssignment).flatMap(getAssignees).filter(isTslPlaceholder);
};

export const getPlaceholderByName = (block: TslBlock, name: string | undefined): TslPlaceholder | undefined => {
    return name ? streamPlaceholders(block).find((placeholder) => placeholder.name === name) : undefined;
};

export const getStatements = (node: TslBlock | undefined): TslStatement[] => {
    return node?.statements ?? [];
};
