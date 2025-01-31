import { AnyType, DictionaryType, ListType, Type } from './model.js';

export class TTSLTypeChecker {
    // -----------------------------------------------------------------------------------------------------------------
    // General cases
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Checks whether {@link type} is a supertype of {@link other}.
     */
    isSupertypeOf = (type: Type, other: Type): boolean => {
        return this.isSubtypeOf(other, type);
    };

    /**
     * Checks whether {@link type} is a subtype of {@link other}.
     */
    isSubtypeOf = (type: Type, other: Type): boolean => {
        if (type === other) {
            return true;
        } else {
            return false;
        }
    };

    // -----------------------------------------------------------------------------------------------------------------
    // Special cases
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Checks whether {@link type} is allowed as the type of the receiver of an indexed access.
     */
    canBeAccessedByIndex = (type: Type): boolean => {
        return type instanceof ListType || type instanceof DictionaryType;
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
     * Checks whether {@link type} is allowed as the type of a constant parameter.
     */
    canBeTypeOfConstantParameter = (type: Type): boolean => {
        return type instanceof AnyType;
    };
}
