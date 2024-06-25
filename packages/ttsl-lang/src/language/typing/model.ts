import { isEmpty } from '../../helpers/collections.js';
import {
    TslCallable,
    TslDeclaration,
    TslParameter,
    TslResult,
} from '../generated/ast.js';
import { Parameter } from '../helpers/nodeProperties.js';
import { NullConstant } from '../partialEvaluation/model.js';
import { SafeDsServices } from '../safe-ds-module.js';
import { SafeDsTypeFactory } from './safe-ds-type-factory.js';

export type ParameterSubstitutions = Map<TslParameter, Type>;

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
     * Returns an equivalent type that is simplified as much as possible. Types computed by
     * {@link TypeComputer.computeType} are already simplified, so this method is mainly useful for types that are
     * constructed or modified manually.
     */
    abstract simplify(): Type;

    /**
     * Returns a copy of this type with the given type parameters substituted.
     */
    abstract substituteTypeParameters(substitutions: ParameterSubstitutions): Type;

    /**
     * Returns a copy of this type with the given nullability.
     */
    abstract withExplicitNullability(isExplicitlyNullable: boolean): Type;
}

export class CallableType extends Type {
    private readonly factory: SafeDsTypeFactory;

    override isExplicitlyNullable: boolean = false;

    constructor(
        services: SafeDsServices,
        readonly callable: TslCallable,
        readonly parameter: TslParameter | undefined,
        readonly inputType: NamedTupleType<TslParameter>,
        readonly outputType: NamedTupleType<TslResult>,
    ) {
        super();

        this.factory = services.types.TypeFactory;
    }

    override get isFullySubstituted(): boolean {
        return this.inputType.isFullySubstituted && this.outputType.isFullySubstituted;
    }

    /**
     * Returns the type of the parameter at the given index. If the index is out of bounds, returns `undefined`.
     */
    getParameterTypeByIndex(index: number): Type {
        return this.inputType.getTypeOfEntryByIndex(index);
    }

    override equals(other: unknown): boolean {
        if (other === this) {
            return true;
        } else if (!(other instanceof CallableType)) {
            return false;
        }

        return (
            other.callable === this.callable &&
            other.parameter === this.parameter &&
            other.inputType.equals(this.inputType) &&
            other.outputType.equals(this.outputType)
        );
    }

    override toString(): string {
        const inputTypeString = this.inputType.entries
            .map((it) => `${it.name}${Parameter.isOptional(it.declaration) ? '?' : ''}: ${it.type}`)
            .join(', ');

        return `(${inputTypeString}) -> ${this.outputType}`;
    }

    override simplify(): CallableType {
        return this.factory.createCallableType(
            this.callable,
            this.parameter,
            this.factory.createNamedTupleType(...this.inputType.entries.map((it) => it.simplify())),
            this.factory.createNamedTupleType(...this.outputType.entries.map((it) => it.simplify())),
        );
    }

    override substituteTypeParameters(substitutions: ParameterSubstitutions): CallableType {
        if (isEmpty(substitutions) || this.isFullySubstituted) {
            return this;
        }

        return this.factory.createCallableType(
            this.callable,
            this.parameter,
            this.inputType.substituteTypeParameters(substitutions),
            this.outputType.substituteTypeParameters(substitutions),
        );
    }

    override withExplicitNullability(isExplicitlyNullable: boolean): Type {
        if (!isExplicitlyNullable) {
            return this;
        }

        return this.factory.createUnionType(this, this.factory.createLiteralType(NullConstant));
    }
}

export class NamedTupleType<T extends TslDeclaration> extends Type {
    private readonly factory: SafeDsTypeFactory;

    readonly entries: NamedTupleEntry<T>[];
    override readonly isExplicitlyNullable = false;
    private _isFullySubstituted: boolean | undefined;

    constructor(services: SafeDsServices, entries: NamedTupleEntry<T>[]) {
        super();

        this.factory = services.types.TypeFactory;
        this.entries = entries;
    }

    override get isFullySubstituted(): boolean {
        if (this._isFullySubstituted === undefined) {
            this._isFullySubstituted = this.entries.every((it) => it.type.isFullySubstituted);
        }

        return this._isFullySubstituted;
    }

    /**
     * The length of this tuple.
     */
    get length(): number {
        return this.entries.length;
    }

    /**
     * Returns the type of the entry at the given index. If the index is out of bounds, returns `undefined`.
     */
    getTypeOfEntryByIndex(index: number): Type {
        return this.entries[index]?.type ?? UnknownType;
    }

    override equals(other: unknown): boolean {
        if (other === this) {
            return true;
        } else if (!(other instanceof NamedTupleType)) {
            return false;
        }

        return (
            this.entries.length === other.entries.length &&
            this.entries.every((entry, i) => entry.equals(other.entries[i]))
        );
    }

    override toString(): string {
        return `(${this.entries.join(', ')})`;
    }

    /**
     * If this only has one entry, returns its type. Otherwise, returns this.
     */
    override simplify(): Type {
        if (this.entries.length === 1) {
            return this.entries[0]!.type.simplify();
        }

        return this.factory.createNamedTupleType(...this.entries.map((it) => it.simplify()));
    }

    override substituteTypeParameters(substitutions: ParameterSubstitutions): NamedTupleType<T> {
        if (isEmpty(substitutions) || this.isFullySubstituted) {
            return this;
        }

        return this.factory.createNamedTupleType(
            ...this.entries.map((it) => it.substituteTypeParameters(substitutions)),
        );
    }

    override withExplicitNullability(isExplicitlyNullable: boolean): Type {
        if (!isExplicitlyNullable) {
            return this;
        }

        return this.factory.createUnionType(this, this.factory.createLiteralType(NullConstant));
    }
}

export class NamedTupleEntry<T extends TslDeclaration> {
    constructor(
        readonly declaration: T | undefined,
        readonly name: string,
        readonly type: Type,
    ) {}

    equals(other: unknown): boolean {
        /* c8 ignore start */
        if (other === this) {
            return true;
        } else if (!(other instanceof NamedTupleEntry)) {
            return false;
        }
        /* c8 ignore stop */

        return this.declaration === other.declaration && this.name === other.name && this.type.equals(other.type);
    }

    toString(): string {
        return `${this.name}: ${this.type}`;
    }

    substituteTypeParameters(substitutions: ParameterSubstitutions): NamedTupleEntry<T> {
        if (isEmpty(substitutions) || this.type.isFullySubstituted) {
            /* c8 ignore next 2 */
            return this;
        }

        return new NamedTupleEntry(this.declaration, this.name, this.type.substituteTypeParameters(substitutions));
    }

    simplify(): NamedTupleEntry<T> {
        return new NamedTupleEntry(this.declaration, this.name, this.type.simplify());
    }
}

class UnknownTypeClass extends Type {
    override readonly isExplicitlyNullable = false;
    override readonly isFullySubstituted = true;

    override equals(other: unknown): boolean {
        return other instanceof UnknownTypeClass;
    }

    override toString(): string {
        return '$unknown';
    }

    override simplify(): Type {
        return this;
    }

    override substituteTypeParameters(_substitutions: ParameterSubstitutions): Type {
        return this;
    }

    override withExplicitNullability(_isExplicitlyNullable: boolean): Type {
        return this;
    }
}

export const UnknownType = new UnknownTypeClass();
