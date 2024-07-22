import { AstNode, stream } from 'langium';
import { isEmpty } from '../../helpers/collections.js';
import {
    TslBooleanType,
    TslDictionaryType,
    TslFloatType,
    TslIntType,
    TslListType,
    TslStringType,
    TslType,
    TslTypeParameter,
} from '../generated/ast.js';
import { getTypeParameters } from '../helpers/nodeProperties.js';

export type TypeParameterSubstitutions =Type[];

/**
 * The type of an AST node.
 */
export abstract class Type {
    /**
     * Whether this type is explicitly marked as nullable (e.g. using a `?` for named types). A type parameter type can
     * also become nullable if its upper bound is nullable, which is not checked here. Use {@link TypeChecker.canBeNull}
     * if this is relevant for your situation.
     */
    abstract isExplicitlyNullable: boolean;

    /**
     * Whether the type does not contain type parameter types anymore.
     */
    abstract isFullySubstituted: boolean;

    /**
     * Returns whether the type is equal to another type.
     */
    abstract equals(other: unknown): boolean;

    /**
     * Returns a string representation of this type.
     */
    abstract toString(): string;

    /**
     * Returns a copy of this type with the given type parameters substituted.
     */
    abstract substituteTypeParameters(substitutions: TypeParameterSubstitutions): Type;

    /**
     * Returns a copy of this type with the given nullability.
     */
    abstract withExplicitNullability(isExplicitlyNullable: boolean): Type;
}

export class AnyType extends Type {
    constructor(
        override readonly isExplicitlyNullable: boolean,
    ) {
        super();
    }

    override get isFullySubstituted(): boolean {
        return true;
    }

    override equals(other: unknown): boolean {
        if (other === this) {
            return true;
        } else {
            return false;
        }
    }

    override toString(): string {
        let result = 'Any';

        if (this.isExplicitlyNullable) {
            result += '?';
        }

        return result;
    }

    override substituteTypeParameters(substitutions: TypeParameterSubstitutions): AnyType {
        return this;
    }

    override withExplicitNullability(isExplicitlyNullable: boolean): AnyType {
        if (this.isExplicitlyNullable === isExplicitlyNullable) {
            return this;
        }

        return new AnyType(isExplicitlyNullable);
    }
}

export class IntType extends AnyType {
    constructor(
        override readonly isExplicitlyNullable: boolean,
    ) {
        super(isExplicitlyNullable);
    }

    override toString(): string {
        let result = 'Int';

        if (this.isExplicitlyNullable) {
            result += '?';
        }

        return result;
    }
}

export class FloatType extends AnyType {
    constructor(
        override readonly isExplicitlyNullable: boolean,
    ) {
        super(isExplicitlyNullable);
    }

    override toString(): string {
        let result = 'Float';

        if (this.isExplicitlyNullable) {
            result += '?';
        }

        return result;
    }
}

export class StringType extends AnyType {
    constructor(
        override readonly isExplicitlyNullable: boolean,
    ) {
        super(isExplicitlyNullable);
    }

    override toString(): string {
        let result = 'String';

        if (this.isExplicitlyNullable) {
            result += '?';
        }

        return result;
    }
}

export class BooleanType extends AnyType {
    constructor(
        override readonly isExplicitlyNullable: boolean,
    ) {
        super(isExplicitlyNullable);
    }

    override toString(): string {
        let result = 'Boolean';

        if (this.isExplicitlyNullable) {
            result += '?';
        }

        return result;
    }
}

export class DictionaryType extends AnyType {
    private _isFullySubstituted: boolean | undefined;

    constructor(
        readonly substitutions: TypeParameterSubstitutions,
        override readonly isExplicitlyNullable: boolean,
    ) {
        super(isExplicitlyNullable);
    }

    override get isFullySubstituted(): boolean {
        if (this._isFullySubstituted === undefined) {
            this._isFullySubstituted = stream(this.substitutions.values()).every((it) => it.isFullySubstituted);
        }

        return this._isFullySubstituted;
    }

    getTypeParameterTypeByIndex(index: number): Type {
        return Array.from(this.substitutions.values())[index] ?? UnknownType;
    }

    override toString(): string {
        let result = 'Dictionary';

        if (this.substitutions.length > 0) {
            result += `<${Array.from(this.substitutions.values())
                .map((value) => value.toString())
                .join(', ')}>`;
        }

        if (this.isExplicitlyNullable) {
            result += '?';
        }

        return result;
    }

    override substituteTypeParameters(substitutions: TypeParameterSubstitutions): DictionaryType {
        if (isEmpty(substitutions) || this.isFullySubstituted) {
            return this;
        }

        const newSubstitutions = substitutions;

        return new DictionaryType(newSubstitutions, this.isExplicitlyNullable);
    }

    override withExplicitNullability(isExplicitlyNullable: boolean): DictionaryType {
        if (this.isExplicitlyNullable === isExplicitlyNullable) {
            return this;
        }

        return new DictionaryType(this.substitutions, isExplicitlyNullable);
    }
}

export class ListType extends AnyType{
    private _isFullySubstituted: boolean | undefined;

    constructor(
        readonly substitutions: TypeParameterSubstitutions,
        override readonly isExplicitlyNullable: boolean,
    ) {
        super(isExplicitlyNullable);
    }

    override get isFullySubstituted(): boolean {
        if (this._isFullySubstituted === undefined) {
            this._isFullySubstituted = stream(this.substitutions.values()).every((it) => it.isFullySubstituted);
        }

        return this._isFullySubstituted;
    }

    getTypeParameterTypeByIndex(index: number): Type {
        return Array.from(this.substitutions.values())[index] ?? UnknownType;
    }

    override toString(): string {
        let result = 'List';

        if (this.substitutions.length > 0) {
            result += `<${Array.from(this.substitutions.values())
                .map((value) => value.toString())
                .join(', ')}>`;
        }

        if (this.isExplicitlyNullable) {
            result += '?';
        }

        return result;
    }

    override substituteTypeParameters(substitutions: TypeParameterSubstitutions): ListType {
        if (isEmpty(substitutions) || this.isFullySubstituted) {
            return this;
        }

        const newSubstitutions = substitutions;

        return new ListType(newSubstitutions, this.isExplicitlyNullable);
    }

    override withExplicitNullability(isExplicitlyNullable: boolean): ListType {
        if (this.isExplicitlyNullable === isExplicitlyNullable) {
            return this;
        }

        return new ListType(this.substitutions, isExplicitlyNullable);
    }
}

export class NothingType extends AnyType{
    constructor(
        override readonly isExplicitlyNullable: boolean,
    ) {
        super(isExplicitlyNullable);
    }

    override toString(): string {
        let result = 'Nothing';

        if (this.isExplicitlyNullable) {
            result += '?';
        }

        return result;
    }
}

class UnknownTypeClass extends AnyType {

    override equals(other: unknown): boolean {
        return other instanceof UnknownTypeClass;
    }

    override toString(): string {
        return '$unknown';
    }

    override substituteTypeParameters(_substitutions: TypeParameterSubstitutions): Type {
        return this;
    }

    override withExplicitNullability(_isExplicitlyNullable: boolean): Type {
        return this;
    }
}

export const UnknownType = new UnknownTypeClass(false);
