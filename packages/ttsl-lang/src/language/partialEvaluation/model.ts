import { stream } from 'langium';
import { TslResult, type TslCallable, type TslDeclaration, type TslParameter } from '../generated/ast.js';
import { escapeString } from '../grammar/ttsl-value-converter.js';

export type ParameterSubstitutions = Map<TslParameter, EvaluatedNode>;
export type ResultSubstitutions = Map<TslResult, EvaluatedNode>;

/**
 * A node that has been partially evaluated.
 */
export abstract class EvaluatedNode {
    /**
     * Whether the node could be evaluated completely.
     */
    abstract readonly isFullyEvaluated: boolean;

    /**
     * Returns whether the node is equal to another value.
     */
    abstract equals(other: unknown): boolean;

    /**
     * Returns the string representation of the node.
     */
    abstract toString(): string;

    /**
     * Removes any unnecessary containers from the node.
     */
    unwrap(): EvaluatedNode {
        return this;
    }
}

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------

export abstract class Constant extends EvaluatedNode {
    override readonly isFullyEvaluated: boolean = true;

    /**
     * Returns the string representation of the constant if it occurs in a string template.
     */
    toInterpolationString(): string {
        return this.toString();
    }
}

export class BooleanConstant extends Constant {
    constructor(readonly value: boolean) {
        super();
    }

    override equals(other: unknown): boolean {
        return other instanceof BooleanConstant && this.value === other.value;
    }

    override toString(): string {
        return this.value.toString();
    }
}

export abstract class NumberConstant extends Constant {
    abstract readonly value: number | bigint;
}

export class FloatConstant extends NumberConstant {
    constructor(readonly value: number) {
        super();
    }

    override equals(other: unknown): boolean {
        return other instanceof FloatConstant && this.value === other.value;
    }

    override toString(): string {
        const string = this.value.toString();

        if (!string.includes('.')) {
            return `${string}.0`;
        } else {
            return string;
        }
    }
}

export class IntConstant extends NumberConstant {
    constructor(readonly value: bigint) {
        super();
    }

    override equals(other: unknown): boolean {
        return other instanceof IntConstant && this.value === other.value;
    }

    override toString(): string {
        return this.value.toString();
    }
}

class NullConstantClass extends Constant {
    override equals(other: unknown): boolean {
        return other instanceof NullConstantClass;
    }

    override toString(): string {
        return 'null';
    }
}

export const NullConstant = new NullConstantClass();

export class StringConstant extends Constant {
    constructor(readonly value: string) {
        super();
    }

    override equals(other: unknown): boolean {
        return other instanceof StringConstant && this.value === other.value;
    }

    override toString(): string {
        return `"${escapeString(this.value)}"`;
    }

    override toInterpolationString(): string {
        return escapeString(this.value);
    }
}

export const isConstant = (node: EvaluatedNode): node is Constant => {
    return node instanceof Constant;
};

// -------------------------------------------------------------------------------------------------
// Callables
// -------------------------------------------------------------------------------------------------

export abstract class EvaluatedCallable extends EvaluatedNode {
    abstract readonly callable: TslCallable | TslParameter;
    abstract readonly substitutionsOnCreation: ParameterSubstitutions;
    override readonly isFullyEvaluated: boolean = false;
}

export class NamedCallable<T extends (TslCallable & TslDeclaration) | TslParameter> extends EvaluatedCallable {
    override readonly isFullyEvaluated: boolean = false;
    override readonly substitutionsOnCreation: ParameterSubstitutions = new Map();

    constructor(override readonly callable: T) {
        super();
    }

    override equals(other: unknown): boolean {
        return other instanceof NamedCallable && this.callable === other.callable;
    }

    override toString(): string {
        return this.callable.name;
    }
}

// -------------------------------------------------------------------------------------------------
// Other
// -------------------------------------------------------------------------------------------------

export class EvaluatedList extends EvaluatedNode {
    constructor(readonly elements: EvaluatedNode[]) {
        super();
    }

    override readonly isFullyEvaluated: boolean = this.elements.every(isFullyEvaluated);

    /**
     * Returns the element at the given index. If the index is out of bounds, `UnknownEvaluatedNode` is returned.
     *
     * @param index The index of the element to look for.
     */
    getElementByIndex(index: number): EvaluatedNode {
        return this.elements[index] ?? UnknownEvaluatedNode;
    }

    /**
     * Returns the size of the list.
     */
    get size(): number {
        return this.elements.length;
    }

    override equals(other: unknown): boolean {
        if (other === this) {
            return true;
        } else if (!(other instanceof EvaluatedList)) {
            return false;
        }

        return this.size === other.size && this.elements.every((e, i) => e.equals(other.elements[i]));
    }

    override toString(): string {
        return `[${this.elements.join(', ')}]`;
    }
}

export class EvaluatedMap extends EvaluatedNode {
    constructor(private readonly entries: EvaluatedMapEntry[]) {
        super();
    }

    override readonly isFullyEvaluated: boolean = this.entries.every(isFullyEvaluated);

    /**
     * Returns the last value for the given key. If the key does not occur in the map, `UnknownEvaluatedNode` is
     * returned.
     *
     * @param key The key to look for.
     */
    getLastValueForKey(key: EvaluatedNode): EvaluatedNode {
        return this.entries.findLast((it) => it.key.equals(key))?.value ?? UnknownEvaluatedNode;
    }

    /**
     * Returns whether the map contains the given key.
     *
     * @param key The key to look for.
     */
    has(key: EvaluatedNode): boolean {
        return this.entries.some((it) => it.key.equals(key));
    }

    override equals(other: unknown): boolean {
        if (other === this) {
            return true;
        } else if (!(other instanceof EvaluatedMap)) {
            return false;
        }

        return (
            this.entries.length === other.entries.length &&
            this.entries.every((entry, i) => entry.equals(other.entries[i]))
        );
    }

    override toString(): string {
        return `{${this.entries.join(', ')}}`;
    }
}

export class EvaluatedMapEntry extends EvaluatedNode {
    constructor(
        readonly key: EvaluatedNode,
        readonly value: EvaluatedNode,
    ) {
        super();
    }

    override readonly isFullyEvaluated: boolean = this.key.isFullyEvaluated && this.value.isFullyEvaluated;

    override equals(other: unknown): boolean {
        if (other === this) {
            return true;
        } else if (!(other instanceof EvaluatedMapEntry)) {
            return false;
        }

        return this.key.equals(other.key) && this.value.equals(other.value);
    }

    override toString(): string {
        return `${this.key}: ${this.value}`;
    }
}

/**
 * A named tuple is a record that contains a mapping from result declarations to their values. It is used to represent
 * the result of a call to a block lambda or a segment.
 */
export class EvaluatedNamedTuple extends EvaluatedNode {
    constructor(private readonly entries: ResultSubstitutions) {
        super();
    }

    override readonly isFullyEvaluated: boolean = stream(this.entries.values()).every(isFullyEvaluated);

    /**
     * Returns the value of the result with the given name. If the result does not occur in the record,
     * `UnknownEvaluatedNode` is returned.
     *
     * @param name The name of the result to look for.
     */
    getResultValueByName(name: string): EvaluatedNode {
        const result = stream(this.entries.keys()).find((it) => it.name === name);
        if (!result) {
            return UnknownEvaluatedNode;
        }

        return this.entries.get(result) ?? UnknownEvaluatedNode;
    }

    /**
     * Returns the value of the result at the given index. If the index is out of bounds, `UnknownEvaluatedNode` is
     * returned.
     *
     * @param index The index of the result to look for.
     */
    getResultValueByIndex(index: number): EvaluatedNode {
        return Array.from(this.entries.values())[index] ?? UnknownEvaluatedNode;
    }

    /**
     * If the record contains exactly one substitution its value is returned. Otherwise, it returns `this`.
     */
    override unwrap(): EvaluatedNode {
        if (this.entries.size === 1) {
            return this.entries.values().next().value!;
        } else {
            return this;
        }
    }

    override equals(other: unknown): boolean {
        if (other === this) {
            return true;
        } else if (!(other instanceof EvaluatedNamedTuple)) {
            return false;
        }

        return substitutionsAreEqual(this.entries, other.entries);
    }

    override toString(): string {
        const entryString = Array.from(this.entries, ([result, value]) => `${result.name} = ${value}`).join(', ');
        return `(${entryString})`;
    }
}

class UnknownEvaluatedNodeClass extends EvaluatedNode {
    override readonly isFullyEvaluated: boolean = false;

    override equals(other: unknown): boolean {
        return other instanceof UnknownEvaluatedNodeClass;
    }

    override toString(): string {
        return '?';
    }
}

export const UnknownEvaluatedNode = new UnknownEvaluatedNodeClass();

// -------------------------------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------------------------------

const isFullyEvaluated = (node: EvaluatedNode): boolean => {
    return node.isFullyEvaluated;
};

export const substitutionsAreEqual = (
    a: Map<TslDeclaration, EvaluatedNode> | undefined,
    b: Map<TslDeclaration, EvaluatedNode> | undefined,
): boolean => {
    if (a?.size !== b?.size) {
        return false;
    }

    const aEntries = Array.from(a?.entries() ?? []);
    const bEntries = Array.from(b?.entries() ?? []);

    return aEntries.every(([aEntry, aValue], i) => {
        const [bEntry, bValue] = bEntries[i]!;
        return aEntry === bEntry && aValue.equals(bValue);
    });
};
