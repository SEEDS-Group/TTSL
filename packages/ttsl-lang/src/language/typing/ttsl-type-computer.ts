import { AstNode, AstNodeLocator, AstUtils, WorkspaceCache } from 'langium';
import {
    isTslArgument,
    isTslAssignee,
    isTslAssignment,
    isTslCall,
    isTslCallableType,
    isTslDeclaration,
    isTslExpression,
    isTslFunction,
    isTslIndexedAccess,
    isTslInfixOperation,
    isTslList,
    isTslDictionary,
    isTslParameter,
    isTslPrefixOperation,
    isTslReference,
    isTslResult,
    isTslTemplateString,
    isTslType,
    isTslTypeCast,
    TslAssignee,
    TslCall,
    TslCallableType,
    TslDeclaration,
    TslExpression,
    TslFunction,
    TslIndexedAccess,
    TslInfixOperation,
    TslParameter,
    TslPrefixOperation,
    TslReference,
    TslType,
    TslResult,
} from '../generated/ast.js';
import {
    getParameters,
    getResults,
} from '../helpers/nodeProperties.js';
import {
    BooleanConstant,
    Constant,
    FloatConstant,
    IntConstant,
    NullConstant,
    StringConstant,
} from '../partialEvaluation/model.js';
import { TTSLServices } from '../ttsl-module.js';
import {
    CallableType,
    NamedTupleEntry,
    NamedTupleType,
    Type,
    DictionaryType,
    ListType,
    UnknownType,
} from './model.js';
import { TTSLCoreTypes } from './ttsl-core-types.js';
import type { TTSLTypeChecker } from './ttsl-type-checker.js';
import { TTSLTypeFactory } from './ttsl-type-factory.js';

export class TTSLTypeComputer {
    private readonly astNodeLocator: AstNodeLocator;
    private readonly coreTypes: TTSLCoreTypes;
    private readonly factory: TTSLTypeFactory;
    private readonly typeChecker: TTSLTypeChecker;

    private readonly nodeTypeCache: WorkspaceCache<string, Type>;

    constructor(services: TTSLServices) {
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.coreTypes = services.types.CoreTypes;
        this.factory = services.types.TypeFactory;
        this.typeChecker = services.types.TypeChecker;

        this.nodeTypeCache = new WorkspaceCache(services.shared);
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Compute type
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Computes the type of the given node and applies the given substitutions for type parameters. The result gets
     * simplified as much as possible.
     */
    computeType(node: AstNode | undefined): Type {
        if (!node) {
            return UnknownType;
        }

        // Ignore type parameter substitutions for caching
        const unsubstitutedType = this.nodeTypeCache.get(this.getNodeId(node), () =>
            this.doComputeType(node).simplify(),
        );
        return unsubstitutedType;
    }

    private getNodeId(node: AstNode) {
        const documentUri = AstUtils.getDocument(node).uri.toString();
        const nodePath = this.astNodeLocator.getAstNodePath(node);
        return `${documentUri}~${nodePath}`;
    }

    private doComputeType(node: AstNode): Type {
        if (isTslAssignee(node)) {
            return this.computeTypeOfAssignee(node);
        } else if (isTslDeclaration(node)) {
            return this.computeTypeOfDeclaration(node);
        } else if (isTslExpression(node)) {
            return this.computeTypeOfExpression(node);
        } else if (isTslType(node)) {
            return this.computeTypeOfType(node);
        } /* c8 ignore start */ else {
            return UnknownType;
        } /* c8 ignore stop */
    }

    private computeTypeOfAssignee(node: TslAssignee): Type {
        const containingAssignment = AstUtils.getContainerOfType(node, isTslAssignment);
        if (!containingAssignment) {
            /* c8 ignore next 2 */
            return UnknownType;
        }

        const assigneePosition = node.$containerIndex ?? -1;
        const expressionType = this.computeType(containingAssignment?.expression);
        if (expressionType instanceof NamedTupleType) {
            return expressionType.getTypeOfEntryByIndex(assigneePosition);
        } else if (assigneePosition === 0) {
            return expressionType;
        }

        return UnknownType;
    }

    private computeTypeOfDeclaration(node: TslDeclaration): Type {
        if (isTslFunction(node)) {
            return this.computeTypeOfCallableWithManifestTypes(node);
        } else if (isTslParameter(node)) {
            return this.computeTypeOfParameter(node);
        } else if (isTslResult(node)) {
            return this.computeType(node.type);
        } /* c8 ignore start */ else {
            return UnknownType;
        } /* c8 ignore stop */
    }

    private computeTypeOfCallableWithManifestTypes(node: TslFunction | TslCallableType): Type {
        const parameterEntries = getParameters(node).map(
            (it) => new NamedTupleEntry(it, it.name, this.computeType(it.type)),
        );
        let resultEntries: NamedTupleEntry<TslResult>[] = []
        if(isTslFunction(node)){
            resultEntries.with(0, new NamedTupleEntry(node.result, node.name, this.computeType(node.result?.type)))
        }else{
            resultEntries = getResults(node).map(
                (it) => new NamedTupleEntry(it, it.name, this.computeType(it.type)),
            );
        }
        

        return this.factory.createCallableType(
            node,
            undefined,
            this.factory.createNamedTupleType(...parameterEntries),
            this.factory.createNamedTupleType(...resultEntries),
        );
    }

    private computeTypeOfParameter(node: TslParameter): Type {
        // Manifest type
        const type = this.computeType(node.type);
        return this.rememberParameterInCallableType(node, type);
    }

    private rememberParameterInCallableType(node: TslParameter, type: Type) {
        if (type instanceof CallableType) {
            return this.factory.createCallableType(type.callable, node, type.inputType, type.outputType);
        } else {
            return type;
        }
    }

    private computeTypeOfExpression(node: TslExpression): Type {
        // Type cast
        if (isTslTypeCast(node)) {
            return this.computeType(node.type);
        }

        // Terminal cases
        if (isTslList(node)) {
            const elementType = this.lowestCommonSupertype(node.elements.map((it) => this.computeType(it)));
            return this.coreTypes.List(elementType);
        } else if (isTslDictionary(node)) {
            let keyType = this.lowestCommonSupertype(node.entries.map((it) => this.computeType(it.key)));

            const valueType = this.lowestCommonSupertype(node.entries.map((it) => this.computeType(it.value)));
            return this.coreTypes.Map(keyType, valueType);
        } else if (isTslTemplateString(node)) {
            return this.coreTypes.String;
        }

        // Recursive cases
        else if (isTslArgument(node)) {
            return this.computeType(node.value);
        } else if (isTslCall(node)) {
            return this.computeTypeOfCall(node);
        } else if (isTslIndexedAccess(node)) {
            return this.computeTypeOfIndexedAccess(node);
        } else if (isTslInfixOperation(node)) {
            switch (node.operator) {
                // Boolean operators
                case 'or':
                case 'and':
                    return this.coreTypes.Boolean;

                // Equality operators
                case '==':
                case '!=':
                case '===':
                case '!==':
                    return this.coreTypes.Boolean;

                // Comparison operators
                case '<':
                case '<=':
                case '>=':
                case '>':
                    return this.coreTypes.Boolean;

                // Arithmetic operators
                case '+':
                case '-':
                case '*':
                case '/':
                    return this.computeTypeOfArithmeticInfixOperation(node);

                // Elvis operator
                case '?:':
                    return this.computeTypeOfElvisOperation(node);

                // Unknown operator
                /* c8 ignore next 2 */
                default:
                    return UnknownType;
            }
        } else if (isTslPrefixOperation(node)) {
            switch (node.operator) {
                case 'not':
                    return this.coreTypes.Boolean;
                case '-':
                    return this.computeTypeOfArithmeticPrefixOperation(node);

                // Unknown operator
                /* c8 ignore next 2 */
                default:
                    return UnknownType;
            }
        } else if (isTslReference(node)) {
            return this.computeTypeOfReference(node);
        } /* c8 ignore start */ else {
            return UnknownType;
        } /* c8 ignore stop */
    }

    private computeTypeOfCall(node: TslCall): Type {
        const receiverType = this.computeType(node.receiver);
        const nonNullableReceiverType = this.computeNonNullableType(receiverType);
        let result: Type = UnknownType;

        if (nonNullableReceiverType instanceof CallableType) {
            result = nonNullableReceiverType.outputType;
            
            // Substitute type parameters
            if (isTslFunction(nonNullableReceiverType.callable)) {
                result = receiverType
            }
        }

        // Update nullability
        return result.withExplicitNullability(receiverType.isExplicitlyNullable && node.isNullSafe);
    }

    private computeTypeOfIndexedAccess(node: TslIndexedAccess): Type {
        const receiverType = this.computeType(node.receiver);
        if (!(receiverType instanceof ListType) && !(receiverType instanceof DictionaryType)) {
            return UnknownType;
        }

        // Receiver is a list
        if (receiverType instanceof ListType) {
            return receiverType
                .getValueTypeByIndex(0)
                .withExplicitNullability(receiverType.isExplicitlyNullable && node.isNullSafe);
        }

        // Receiver is a Dictionary
        if (receiverType instanceof DictionaryType) {
            return receiverType
                .getValueTypeByIndex(1)
                .withExplicitNullability(receiverType.isExplicitlyNullable && node.isNullSafe);
        }

        return UnknownType;
    }

    private computeTypeOfArithmeticInfixOperation(node: TslInfixOperation): Type {
        const leftOperandType = this.computeType(node.leftOperand);
        const rightOperandType = this.computeType(node.rightOperand);

        if (
            this.typeChecker.isSubtypeOf(leftOperandType, this.coreTypes.Int) &&
            this.typeChecker.isSubtypeOf(rightOperandType, this.coreTypes.Int)
        ) {
            return this.coreTypes.Int;
        } else {
            return this.coreTypes.Float;
        }
    }

    private computeTypeOfElvisOperation(node: TslInfixOperation): Type {
        const leftOperandType = this.computeType(node.leftOperand);
        if (leftOperandType.isExplicitlyNullable) {
            const rightOperandType = this.computeType(node.rightOperand);
            return rightOperandType;
        } else {
            return leftOperandType;
        }
    }

    private computeTypeOfArithmeticPrefixOperation(node: TslPrefixOperation): Type {
        const operandType = this.computeType(node.operand);

        if (this.typeChecker.isSubtypeOf(operandType, this.coreTypes.Int)) {
            return this.coreTypes.Int;
        } else {
            return this.coreTypes.Float;
        }
    }

    private computeTypeOfReference(node: TslReference): Type {
        const target = node.target.ref;
        const instanceType = this.computeType(target);

        return instanceType;
    }

    private computeTypeOfType(node: TslType): Type {
        if (isTslCallableType(node)) {
            return this.computeTypeOfCallableWithManifestTypes(node);
        } /* c8 ignore start */ else {
            return UnknownType;
        } /* c8 ignore stop */
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Various type conversions
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Returns the non-nullable type for the given type. The result is simplified as much as possible.
     */
    computeNonNullableType(type: Type): Type {
        return type.withExplicitNullability(false).simplify();
    }

    /**
     * Returns the lowest class type for the given constant.
     */
    computeClassTypeForConstant(constant: Constant): Type {
        if (constant instanceof BooleanConstant) {
            return this.coreTypes.Boolean;
        } else if (constant instanceof FloatConstant) {
            return this.coreTypes.Float;
        } else if (constant instanceof IntConstant) {
            return this.coreTypes.Int;
        } else if (constant === NullConstant) {
            return this.coreTypes.NothingOrNull;
        } else if (constant instanceof StringConstant) {
            return this.coreTypes.String;
        } /* c8 ignore start */ else {
            throw new Error(`Unexpected constant type: ${constant.constructor.name}`);
        } /* c8 ignore stop */
    }

// -----------------------------------------------------------------------------------------------------------------
    // Lowest common supertype
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Computes the lowest common supertype for the given types. The result is simplified as much as possible.
     */
    private lowestCommonSupertype(types: Type[], options: LowestCommonSupertypeOptions = {}): Type {
        // Simplify types
        const simplifiedTypes = this.simplifyTypesLCS(types, options);

        // A single type is its own lowest common supertype
        if (simplifiedTypes.length === 1) {
            return simplifiedTypes[0]!;
        }

        // Partition types by their kind
        const partitionedTypes = this.partitionTypesLCS(simplifiedTypes);

        // Includes unknown type
        if (partitionedTypes.containsUnknownType) {
            return this.coreTypes.AnyOrNull;
        }

        // The result must be nullable if any of the types is nullable
        const isNullable = simplifiedTypes.some((it) => it.isExplicitlyNullable);

        // Includes unhandled type
        if (partitionedTypes.containsOtherType) {
            return this.Any(isNullable);
        }

        return UnknownType
    }

    
    /**
     * Simplifies a list of types for the purpose of computing the lowest common supertype (LCS).
     */
    private simplifyTypesLCS(types: Type[], options: LowestCommonSupertypeOptions): Type[] {
        if (options.skipTypeSimplification) {
            return types;
        }

        const simplifiedType = this.factory.createUnionType(types).simplify();

        return [simplifiedType];
    }

    /**
     * Partitions the given types by their kind. This function assumes that union types have been removed. It is only
     * meant to be used when computing the lowest common supertype (LCS).
     */
    private partitionTypesLCS(types: Type[]): PartitionTypesLCSResult {
        const result: PartitionTypesLCSResult = {
            containsUnknownType: false,
            containsOtherType: false,
        };

        for (const type of types) {
            if (type.equals(this.coreTypes.Nothing) || type.equals(this.coreTypes.NothingOrNull)) {
                // Drop Nothing/Nothing? types. They are compatible to everything with appropriate nullability.
            } else if (type === UnknownType) {
                result.containsUnknownType = true;
            } else {
                // Since these types don't occur in legal programs, we don't need to handle them better
                result.containsOtherType = true;
                return result;
            }
        }

        return result;
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------------------------------------------------

    private Any(isNullable: boolean): Type {
        return isNullable ? this.coreTypes.AnyOrNull : this.coreTypes.Any;
    }

}

/**
 * Options for {@link lowestCommonSupertype}.
 */
interface LowestCommonSupertypeOptions {
    /**
     * If `true`, the type simplification is skipped and the given types are used as is.
     */
    skipTypeSimplification?: boolean;
}

interface PartitionTypesLCSResult {
    containsUnknownType: boolean;
    containsOtherType: boolean;
}
