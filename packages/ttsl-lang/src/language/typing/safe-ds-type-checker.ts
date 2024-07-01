import {  TslDeclaration } from '../generated/ast.js';
import { Parameter } from '../helpers/nodeProperties.js';
import { SafeDsServices } from '../safe-ds-module.js';
import {
    CallableType,
    DictionaryType,
    ListType,
    NamedTupleType,
    Type,
    UnionType,
    UnknownType,
} from './model.js';
import { SafeDsCoreTypes } from './safe-ds-core-types.js';
import type { SafeDsTypeComputer } from './safe-ds-type-computer.js';

export class SafeDsTypeChecker {
    private readonly coreTypes: SafeDsCoreTypes;
    private readonly typeComputer: () => SafeDsTypeComputer;

    constructor(services: SafeDsServices) {
        this.coreTypes = services.types.CoreTypes;
        this.typeComputer = () => services.types.TypeComputer;
    }

    // -----------------------------------------------------------------------------------------------------------------
    // General cases
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Checks whether {@link type} is a supertype of {@link other}.
     */
    isSupertypeOf = (type: Type, other: Type, options: TypeCheckOptions = {}): boolean => {
        return this.isSubtypeOf(other, type, options);
    };

    /**
     * Checks whether {@link type} is a subtype of {@link other}.
     */
    isSubtypeOf = (type: Type, other: Type, options: TypeCheckOptions = {}): boolean => {
        if (type.equals(this.coreTypes.Nothing) || other.equals(this.coreTypes.AnyOrNull)) {
            return true;
        } else if (type === UnknownType || other === UnknownType) {
            return false;
        }

        if (other instanceof UnionType) {
            return other.types.some((it) => this.isSubtypeOf(type, it, options));
        }

        if (type instanceof CallableType) {
            return this.callableTypeIsSubtypeOf(type, other, options);
        } else if (type instanceof NamedTupleType) {
            return this.namedTupleTypeIsSubtypeOf(type, other, options);
        } else if (type instanceof UnionType) {
            return this.unionTypeIsSubtypeOf(type, other, options);
        } /* c8 ignore start */ else {
            throw new Error(`Unexpected type: ${type.constructor.name}`);
        } /* c8 ignore stop */
    };

    private callableTypeIsSubtypeOf(type: CallableType, other: Type, options: TypeCheckOptions): boolean {
        if (other instanceof CallableType) {
            // Must accept at least as many parameters and produce at least as many results
            if (type.inputType.length < other.inputType.length || type.outputType.length < other.outputType.length) {
                return false;
            }

            // Check expected parameters
            for (let i = 0; i < other.inputType.length; i++) {
                const typeEntry = type.inputType.entries[i]!;
                const otherEntry = other.inputType.entries[i]!;

                // Names must match
                if (typeEntry.name !== otherEntry.name) {
                    return false;
                }

                // Optionality must match (all but required to optional is OK)
                if (Parameter.isRequired(typeEntry.declaration) && Parameter.isOptional(otherEntry.declaration)) {
                    return false;
                }

                // Types must be contravariant
                if (!this.isSubtypeOf(otherEntry.type, typeEntry.type, options)) {
                    return false;
                }
            }

            // Additional parameters must be optional
            for (let i = other.inputType.length; i < type.inputType.length; i++) {
                const typeEntry = type.inputType.entries[i]!;
                if (!Parameter.isOptional(typeEntry.declaration)) {
                    return false;
                }
            }

            // Check expected results
            for (let i = 0; i < other.outputType.length; i++) {
                const typeEntry = type.outputType.entries[i]!;
                const otherEntry = other.outputType.entries[i]!;

                // Names must not match since we always fetch results by index

                // Types must be covariant
                if (!this.isSubtypeOf(typeEntry.type, otherEntry.type, options)) {
                    return false;
                }
            }

            // Additional results are OK

            return true;
        } else {
            return false;
        }
    }

    private namedTupleTypeIsSubtypeOf(
        type: NamedTupleType<TslDeclaration>,
        other: Type,
        options: TypeCheckOptions,
    ): boolean {
        if (other instanceof NamedTupleType) {
            return (
                type.length === other.length &&
                type.entries.every((typeEntry, i) => {
                    const otherEntry = other.entries[i]!;
                    // We deliberately ignore the declarations here
                    return (
                        typeEntry.name === otherEntry.name && this.isSubtypeOf(typeEntry.type, otherEntry.type, options)
                    );
                })
            );
        } else {
            return false;
        }
    }

    private unionTypeIsSubtypeOf(type: UnionType, other: Type, options: TypeCheckOptions): boolean {
        return type.types.every((it) => this.isSubtypeOf(it, other, options));
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Special cases
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Checks whether {@link type} is allowed as the type of the receiver of an indexed access.
     */
    canBeAccessedByIndex = (type: Type): boolean => {
        return this.isList(type) || this.isMap(type);
    };

    /**
     * Checks whether {@link type} is allowed as the type of the receiver of a call.
     */
    canBeCalled = (type: Type): boolean => {
        // We must create the non-nullable version since calls can be null-safe
        const nonNullableReceiverType = this.typeComputer().computeNonNullableType(type);

        if (nonNullableReceiverType instanceof CallableType) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Returns whether {@link type} can be `null`. Compared to {@link Type.isExplicitlyNullable}, this method also considers the
     * upper bound of type parameter types.
     */
    canBeNull = (type: Type): boolean => {
        if (type.isExplicitlyNullable) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Checks whether {@link type} is some kind of list (with any element type).
     */
    isList(type: Type): type is ListType {
        const listOrNull = this.coreTypes.List(UnknownType).withExplicitNullability(true);

        return (
            !type.equals(this.coreTypes.Nothing) &&
            !type.equals(this.coreTypes.NothingOrNull) &&
            this.isSubtypeOf(type, listOrNull, {
                ignoreTypeParameters: true,
            })
        );
    }

    /**
     * Checks whether {@link type} is some kind of map (with any key/value types).
     */
    isMap(type: Type): type is DictionaryType {
        const mapOrNull = this.coreTypes.Map(UnknownType, UnknownType).withExplicitNullability(true);

        return (
            !type.equals(this.coreTypes.Nothing) &&
            !type.equals(this.coreTypes.NothingOrNull) &&
            this.isSubtypeOf(type, mapOrNull, {
                ignoreTypeParameters: true,
            })
        );
    }
}

/**
 * Options for {@link SafeDsTypeChecker.isSubtypeOf} and {@link SafeDsTypeChecker.isSupertypeOf}.
 */
interface TypeCheckOptions {
    /**
     * Whether to ignore type parameters when comparing class types.
     */
    ignoreTypeParameters?: boolean;
}
