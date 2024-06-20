import { AstNode, AstUtils, Stream, stream } from 'langium';
import {
    isTslAnnotation,
    isTslArgument,
    isTslArgumentList,
    isTslAssignment,
    isTslAttribute,
    isTslBlockLambda,
    isTslBlockLambdaResult,
    isTslCallable,
    isTslCallableType,
    isTslClass,
    isTslDeclaration,
    isTslEnum,
    isTslEnumVariant,
    isTslFunction,
    isTslLambda,
    isTslModule,
    isTslModuleMember,
    isTslNamedType,
    isTslParameter,
    isTslParameterBound,
    isTslPlaceholder,
    isTslQualifiedImport,
    isTslSegment,
    isTslTypeArgumentList,
    isTslTypeParameter,
    isTslTypeParameterList,
    TslAbstractCall,
    TslAbstractResult,
    TslAnnotatedObject,
    TslAnnotation,
    TslAnnotationCall,
    TslArgument,
    TslArgumentList,
    TslAssignee,
    TslAssignment,
    TslBlock,
    TslBlockLambda,
    TslBlockLambdaResult,
    TslCallable,
    TslClass,
    TslClassMember,
    TslColumn,
    TslConstraint,
    TslDeclaration,
    TslEnum,
    TslEnumVariant,
    TslImport,
    TslImportedDeclaration,
    TslLiteral,
    TslLiteralType,
    TslModule,
    TslModuleMember,
    TslNamedType,
    TslNamedTypeDeclaration,
    TslParameter,
    TslParameterBound,
    TslPlaceholder,
    TslQualifiedImport,
    TslResult,
    TslResultList,
    TslSchema,
    TslStatement,
    TslType,
    TslTypeArgument,
    TslTypeArgumentList,
    TslTypeParameter,
    TslTypeParameterList,
} from '../generated/ast.js';

// -------------------------------------------------------------------------------------------------
// Checks
// -------------------------------------------------------------------------------------------------

export const hasAnnotationCallOf = (
    node: TslAnnotatedObject | undefined,
    expected: TslAnnotation | undefined,
): boolean => {
    return getAnnotationCalls(node).some((it) => {
        const actual = it.annotation?.ref;
        return actual === expected;
    });
};

export const isPackagePrivate = (node: TslDeclaration | undefined): boolean => {
    return isTslSegment(node) && (node.visibility?.isPackageprivate ?? false);
};

export namespace Argument {
    export const isNamed = (node: TslArgument | undefined): boolean => {
        return Boolean(node?.parameter);
    };

    export const isPositional = (node: TslArgument | undefined): boolean => {
        return isTslArgument(node) && !node.parameter;
    };
}

export namespace Enum {
    export const isConstant = (node: TslEnum | undefined): boolean => {
        return Boolean(node) && getEnumVariants(node).every((it) => EnumVariant.isConstant(it));
    };
}

export namespace EnumVariant {
    export const isConstant = (node: TslEnumVariant | undefined): boolean => {
        return Boolean(node) && getParameters(node).every((it) => Parameter.isConstant(it));
    };
}

export namespace Parameter {
    export const isConstant = (node: TslParameter | undefined): boolean => {
        if (!node) {
            return false;
        }

        const containingCallable = AstUtils.getContainerOfType(node, isTslCallable);

        // In those cases, the const modifier is not applicable
        if (isTslCallableType(containingCallable) || isTslLambda(containingCallable)) {
            return false;
        }

        return node.isConstant || isTslAnnotation(containingCallable);
    };

    export const isOptional = (node: TslParameter | undefined): boolean => {
        return Boolean(node?.defaultValue);
    };

    export const isRequired = (node: TslParameter | undefined): boolean => {
        return isTslParameter(node) && !node.defaultValue;
    };

    export const getBounds = (node: TslParameter | undefined): TslParameterBound[] => {
        const callable = AstUtils.getContainerOfType(node, isTslCallable);
        const result = getConstraints(callable).filter((it) => isTslParameterBound(it) && it.leftOperand?.ref === node);
        return result as TslParameterBound[];
    };
}

export const isStatic = (node: TslClassMember | undefined): boolean => {
    if (isTslClass(node) || isTslEnum(node)) {
        return true;
    } else if (isTslAttribute(node)) {
        return node.isStatic;
    } else if (isTslFunction(node)) {
        return node.isStatic;
    } else {
        /* c8 ignore next 2 */
        return false;
    }
};

export namespace TypeArgument {
    export const isNamed = (node: TslTypeArgument | undefined): boolean => {
        return Boolean(node?.typeParameter);
    };
}

export namespace TypeParameter {
    export const isOptional = (node: TslTypeParameter | undefined): boolean => {
        return Boolean(node?.defaultValue);
    };

    export const isRequired = (node: TslTypeParameter | undefined): boolean => {
        return isTslTypeParameter(node) && !node.defaultValue;
    };

    export const isContravariant = (node: TslTypeParameter | undefined): boolean => {
        return isTslTypeParameter(node) && node.variance === 'in';
    };

    export const isCovariant = (node: TslTypeParameter | undefined): boolean => {
        return isTslTypeParameter(node) && node.variance === 'out';
    };

    export const isInvariant = (node: TslTypeParameter | undefined): boolean => {
        return isTslTypeParameter(node) && !node.variance;
    };
}

// -------------------------------------------------------------------------------------------------
// Accessors for list elements
// -------------------------------------------------------------------------------------------------

export const getAbstractResults = (node: TslCallable | undefined): TslAbstractResult[] => {
    if (!node) {
        return [];
    }

    if (isTslBlockLambda(node)) {
        return streamBlockLambdaResults(node).toArray();
    } else if (isTslCallableType(node)) {
        return getResults(node.resultList);
    } else if (isTslFunction(node)) {
        return getResults(node.resultList);
    } else if (isTslSegment(node)) {
        return getResults(node.resultList);
    } /* c8 ignore start */ else {
        return [];
    } /* c8 ignore stop */
};

export const getAnnotationCalls = (node: TslAnnotatedObject | undefined): TslAnnotationCall[] => {
    if (!node) {
        /* c8 ignore next 2 */
        return [];
    }

    if (isTslDeclaration(node)) {
        return node?.annotationCallList?.annotationCalls ?? node?.annotationCalls ?? [];
    } else {
        /* c8 ignore next 2 */
        return node?.annotationCalls ?? [];
    }
};

export const getAnnotationCallTarget = (node: TslAnnotationCall | undefined): TslDeclaration | undefined => {
    return AstUtils.getContainerOfType(node, isTslDeclaration);
};

export const findFirstAnnotationCallOf = (
    node: TslAnnotatedObject | undefined,
    expected: TslAnnotation | undefined,
): TslAnnotationCall | undefined => {
    if (!node || !expected) {
        return undefined;
    }

    return getAnnotationCalls(node).find((it) => {
        const actual = it.annotation?.ref;
        return actual === expected;
    });
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

export const streamBlockLambdaResults = (node: TslBlockLambda | undefined): Stream<TslBlockLambdaResult> => {
    return stream(getStatements(node?.body))
        .filter(isTslAssignment)
        .flatMap(getAssignees)
        .filter(isTslBlockLambdaResult);
};

export const getClassMembers = (node: TslClass | undefined): TslClassMember[] => {
    return node?.body?.members ?? [];
};

export const getConstraints = (node: TslCallable | undefined): TslConstraint[] => {
    if (isTslAnnotation(node)) {
        return node.constraintList?.constraints ?? [];
    } else if (isTslClass(node)) {
        return node.constraintList?.constraints ?? [];
    } else if (isTslEnumVariant(node)) {
        return node.constraintList?.constraints ?? [];
    } else if (isTslFunction(node)) {
        return node.constraintList?.constraints ?? [];
    } else if (isTslSegment(node)) {
        return node.constraintList?.constraints ?? [];
    } else {
        return [];
    }
};

export const getColumns = (node: TslSchema | undefined): TslColumn[] => {
    return node?.columnList?.columns ?? [];
};

export const getEnumVariants = (node: TslEnum | undefined): TslEnumVariant[] => {
    return node?.body?.variants ?? [];
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

export const getLiterals = (node: TslLiteralType | undefined): TslLiteral[] => {
    return node?.literalList?.literals ?? [];
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

export const getParentTypes = (node: TslClass | undefined): TslType[] => {
    return node?.parentTypeList?.parentTypes ?? [];
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

export const getResults = (node: TslResultList | undefined): TslResult[] => {
    return node?.results ?? [];
};

export const getStatements = (node: TslBlock | undefined): TslStatement[] => {
    return node?.statements ?? [];
};

export const getTypeArguments = (node: TslTypeArgumentList | TslNamedType | undefined): TslTypeArgument[] => {
    if (!node) {
        return [];
    }

    if (isTslTypeArgumentList(node)) {
        return node.typeArguments;
    } else if (isTslNamedType(node)) {
        return getTypeArguments(node.typeArgumentList);
    } /* c8 ignore start */ else {
        return [];
    } /* c8 ignore stop */
};

export const getTypeParameters = (
    node: TslTypeParameterList | TslCallable | TslNamedTypeDeclaration | undefined,
): TslTypeParameter[] => {
    if (!node) {
        return [];
    }

    if (isTslTypeParameterList(node)) {
        return node.typeParameters;
    } else if (isTslClass(node)) {
        return getTypeParameters(node.typeParameterList);
    } else if (isTslFunction(node)) {
        return getTypeParameters(node.typeParameterList);
    } /* c8 ignore start */ else {
        return [];
    } /* c8 ignore stop */
};
