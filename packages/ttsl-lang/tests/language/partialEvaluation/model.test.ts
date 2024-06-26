import { EmptyFileSystem } from 'langium';
import { describe, expect, it } from 'vitest';
import {
    isTslBlockLambda,
    isTslEnumVariant,
    isTslExpressionLambda,
    isTslResult,
    isTslSegment,
    type TslBlockLambdaResult,
} from '../../../src/language/generated/ast.js';
import { createSafeDsServices, getAbstractResults, getParameters } from '../../../src/language/index.js';
import {
    BlockLambdaClosure,
    BooleanConstant,
    Constant,
    EvaluatedEnumVariant,
    EvaluatedList,
    EvaluatedMap,
    EvaluatedMapEntry,
    EvaluatedNamedTuple,
    EvaluatedNode,
    ExpressionLambdaClosure,
    FloatConstant,
    IntConstant,
    NamedCallable,
    NullConstant,
    StringConstant,
    UnknownEvaluatedNode,
} from '../../../src/language/partialEvaluation/model.js';
import { getNodeOfType } from '../../helpers/nodeFinder.js';
import type { EqualsTest, ToStringTest } from '../../helpers/testDescription.js';

const services = (await createSafeDsServices(EmptyFileSystem, { omitBuiltins: true })).SafeDs;
const code = `
enum MyEnum {
    MyEnumVariant1
    MyEnumVariant2(p: Int)
}
segment mySegment() -> (result1: Int, result2: Int) {
    () -> 1;
    () -> 2;

    (() { yield a; })().a;
    MyEnum;
}

segment mySegment2() {}
`;
const enumVariantWithoutParameters = await getNodeOfType(services, code, isTslEnumVariant, 0);
const enumVariantWithParameters = await getNodeOfType(services, code, isTslEnumVariant, 1);
const enumVariantParameter = getParameters(enumVariantWithParameters)[0]!;

const result1 = await getNodeOfType(services, code, isTslResult, 0);
const result2 = await getNodeOfType(services, code, isTslResult, 0);

const expressionLambda1 = await getNodeOfType(services, code, isTslExpressionLambda, 0);
const expressionLambda2 = await getNodeOfType(services, code, isTslExpressionLambda, 1);

const blockLambda1 = await getNodeOfType(services, code, isTslBlockLambda, 0);
const blockLambdaResult1 = getAbstractResults(blockLambda1)[0]! as TslBlockLambdaResult;

const segment1 = await getNodeOfType(services, code, isTslSegment, 0);
const segment2 = await getNodeOfType(services, code, isTslSegment, 1);

describe('partial evaluation model', async () => {
    const equalsTests: EqualsTest<EvaluatedNode>[] = [
        {
            value: () => new BooleanConstant(true),
            unequalValueOfSameType: () => new BooleanConstant(false),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () => new FloatConstant(1.0),
            unequalValueOfSameType: () => new FloatConstant(2.0),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () => new IntConstant(1n),
            unequalValueOfSameType: () => new IntConstant(2n),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () => NullConstant,
            valueOfOtherType: () => new StringConstant('foo'),
        },
        {
            value: () => new StringConstant('foo'),
            unequalValueOfSameType: () => new StringConstant('bar'),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () => new BlockLambdaClosure(blockLambda1, new Map([[enumVariantParameter, NullConstant]])),
            unequalValueOfSameType: () => new BlockLambdaClosure(blockLambda1, new Map()),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () =>
                new ExpressionLambdaClosure(expressionLambda1, new Map([[enumVariantParameter, NullConstant]])),
            unequalValueOfSameType: () => new ExpressionLambdaClosure(expressionLambda2, new Map()),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () => new NamedCallable(segment1),
            unequalValueOfSameType: () => new NamedCallable(segment2),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () =>
                new EvaluatedEnumVariant(enumVariantWithParameters, new Map([[enumVariantParameter, NullConstant]])),
            unequalValueOfSameType: () => new EvaluatedEnumVariant(enumVariantWithoutParameters, new Map()),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () => new EvaluatedList([new IntConstant(1n)]),
            unequalValueOfSameType: () => new EvaluatedList([new IntConstant(2n)]),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () => new EvaluatedMap([new EvaluatedMapEntry(NullConstant, NullConstant)]),
            unequalValueOfSameType: () => new EvaluatedMap([new EvaluatedMapEntry(NullConstant, new IntConstant(1n))]),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () => new EvaluatedMapEntry(NullConstant, NullConstant),
            unequalValueOfSameType: () => new EvaluatedMapEntry(UnknownEvaluatedNode, NullConstant),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () => new EvaluatedNamedTuple(new Map([[result1, NullConstant]])),
            unequalValueOfSameType: () => new EvaluatedNamedTuple(new Map()),
            valueOfOtherType: () => NullConstant,
        },
        {
            value: () => UnknownEvaluatedNode,
            valueOfOtherType: () => NullConstant,
        },
    ];

    describe.each(equalsTests)('equals', ({ value, unequalValueOfSameType, valueOfOtherType }) => {
        it(`should return true if both nodes are the same instance (${value().constructor.name})`, () => {
            const nodeInstance = value();
            expect(nodeInstance.equals(nodeInstance)).toBeTruthy();
        });

        it(`should return true if both nodes have the same values (${value().constructor.name})`, () => {
            expect(value().equals(value())).toBeTruthy();
        });

        if (unequalValueOfSameType) {
            it(`should return false if both nodes have different values (${value().constructor.name})`, () => {
                expect(value().equals(unequalValueOfSameType())).toBeFalsy();
            });
        }

        if (valueOfOtherType) {
            it(`should return false if the other node is an instance of another class (${
                value().constructor.name
            })`, () => {
                expect(value().equals(valueOfOtherType())).toBeFalsy();
            });
        }
    });

    const toStringTests: ToStringTest<EvaluatedNode>[] = [
        {
            value: new BooleanConstant(true),
            expectedString: 'true',
        },
        {
            value: new FloatConstant(1.5),
            expectedString: '1.5',
        },
        {
            value: new IntConstant(1n),
            expectedString: '1',
        },
        {
            value: NullConstant,
            expectedString: 'null',
        },
        {
            value: new StringConstant('foo'),
            expectedString: '"foo"',
        },
        {
            value: new BlockLambdaClosure(blockLambda1, new Map()),
            expectedString: '$blockLambdaClosure',
        },
        {
            value: new ExpressionLambdaClosure(expressionLambda1, new Map()),
            expectedString: '$expressionLambdaClosure',
        },
        {
            value: new NamedCallable(segment1),
            expectedString: 'mySegment',
        },
        {
            value: new EvaluatedEnumVariant(enumVariantWithoutParameters, undefined),
            expectedString: 'MyEnumVariant1',
        },
        {
            value: new EvaluatedEnumVariant(enumVariantWithParameters, undefined),
            expectedString: 'MyEnumVariant2',
        },
        {
            value: new EvaluatedEnumVariant(
                enumVariantWithParameters,
                new Map([[enumVariantParameter, UnknownEvaluatedNode]]),
            ),
            expectedString: 'MyEnumVariant2(p = ?)',
        },
        {
            value: new EvaluatedEnumVariant(enumVariantWithParameters, new Map([[enumVariantParameter, NullConstant]])),
            expectedString: 'MyEnumVariant2(p = null)',
        },
        {
            value: new EvaluatedList([]),
            expectedString: '[]',
        },
        {
            value: new EvaluatedList([NullConstant]),
            expectedString: '[null]',
        },
        {
            value: new EvaluatedMap([]),
            expectedString: '{}',
        },
        {
            value: new EvaluatedMap([new EvaluatedMapEntry(NullConstant, NullConstant)]),
            expectedString: '{null: null}',
        },
        {
            value: new EvaluatedMapEntry(NullConstant, NullConstant),
            expectedString: 'null: null',
        },
        {
            value: new EvaluatedNamedTuple(new Map()),
            expectedString: '()',
        },
        {
            value: new EvaluatedNamedTuple(new Map([[result1, NullConstant]])),
            expectedString: '(result1 = null)',
        },
        {
            value: new EvaluatedNamedTuple(new Map([[result1, UnknownEvaluatedNode]])),
            expectedString: '(result1 = ?)',
        },
        {
            value: UnknownEvaluatedNode,
            expectedString: '?',
        },
    ];

    describe.each(toStringTests)('toString', ({ value, expectedString }) => {
        it(`should return the expected string representation (${value.constructor.name} -- ${value})`, () => {
            expect(value.toString()).toStrictEqual(expectedString);
        });
    });

    const isFullyEvaluatedTests: IsFullyEvaluatedTest[] = [
        {
            node: new BooleanConstant(true),
            expectedValue: true,
        },
        {
            node: new FloatConstant(1.0),
            expectedValue: true,
        },
        {
            node: new IntConstant(1n),
            expectedValue: true,
        },
        {
            node: NullConstant,
            expectedValue: true,
        },
        {
            node: new StringConstant('foo'),
            expectedValue: true,
        },
        {
            node: new BlockLambdaClosure(blockLambda1, new Map()),
            expectedValue: false,
        },
        {
            node: new ExpressionLambdaClosure(expressionLambda1, new Map()),
            expectedValue: false,
        },
        {
            node: new NamedCallable(segment1),
            expectedValue: false,
        },
        {
            node: new EvaluatedEnumVariant(enumVariantWithoutParameters, undefined),
            expectedValue: true,
        },
        {
            node: new EvaluatedEnumVariant(enumVariantWithParameters, undefined),
            expectedValue: false,
        },
        {
            node: new EvaluatedEnumVariant(
                enumVariantWithParameters,
                new Map([[enumVariantParameter, UnknownEvaluatedNode]]),
            ),
            expectedValue: false,
        },
        {
            node: new EvaluatedEnumVariant(enumVariantWithParameters, new Map([[enumVariantParameter, NullConstant]])),
            expectedValue: true,
        },
        {
            node: new EvaluatedList([NullConstant]),
            expectedValue: true,
        },
        {
            node: new EvaluatedList([UnknownEvaluatedNode]),
            expectedValue: false,
        },
        {
            node: new EvaluatedMap([new EvaluatedMapEntry(NullConstant, NullConstant)]),
            expectedValue: true,
        },
        {
            node: new EvaluatedMap([new EvaluatedMapEntry(UnknownEvaluatedNode, NullConstant)]),
            expectedValue: false,
        },
        {
            node: new EvaluatedMap([new EvaluatedMapEntry(NullConstant, UnknownEvaluatedNode)]),
            expectedValue: false,
        },
        {
            node: new EvaluatedMapEntry(NullConstant, NullConstant),
            expectedValue: true,
        },
        {
            node: new EvaluatedMapEntry(UnknownEvaluatedNode, NullConstant),
            expectedValue: false,
        },
        {
            node: new EvaluatedMapEntry(NullConstant, UnknownEvaluatedNode),
            expectedValue: false,
        },
        {
            node: new EvaluatedNamedTuple(new Map()),
            expectedValue: true,
        },
        {
            node: new EvaluatedNamedTuple(new Map([[result1, NullConstant]])),
            expectedValue: true,
        },
        {
            node: new EvaluatedNamedTuple(new Map([[result1, UnknownEvaluatedNode]])),
            expectedValue: false,
        },
        {
            node: UnknownEvaluatedNode,
            expectedValue: false,
        },
    ];
    describe.each(isFullyEvaluatedTests)('isFullyEvaluated', ({ node, expectedValue }) => {
        it(`should return the expected value (${node.constructor.name} -- ${node})`, () => {
            expect(node.isFullyEvaluated).toStrictEqual(expectedValue);
        });
    });

    const toInterpolationStringTests: ToStringTest<Constant>[] = [
        { value: new BooleanConstant(true), expectedString: 'true' },
        { value: new FloatConstant(1.5), expectedString: '1.5' },
        { value: new IntConstant(1n), expectedString: '1' },
        { value: NullConstant, expectedString: 'null' },
        { value: new StringConstant('foo'), expectedString: 'foo' },
    ];

    describe.each(toInterpolationStringTests)('toInterpolationString', ({ value, expectedString }) => {
        it(`should return the expected string representation (${value.constructor.name} -- ${value})`, () => {
            expect(value.toInterpolationString()).toStrictEqual(expectedString);
        });
    });

    describe('EvaluatedEnumVariant', () => {
        describe('isFullyEvaluated', () => {
            it.each([
                {
                    variant: new EvaluatedEnumVariant(enumVariantWithoutParameters, undefined),
                    expectedValue: true,
                },
                {
                    variant: new EvaluatedEnumVariant(enumVariantWithParameters, undefined),
                    expectedValue: false,
                },
                {
                    variant: new EvaluatedEnumVariant(
                        enumVariantWithParameters,
                        new Map([[enumVariantParameter, NullConstant]]),
                    ),
                    expectedValue: true,
                },
                {
                    variant: new EvaluatedEnumVariant(
                        enumVariantWithParameters,
                        new Map([[enumVariantParameter, UnknownEvaluatedNode]]),
                    ),
                    expectedValue: false,
                },
            ])('should return the expected value (%#)', ({ variant, expectedValue }) => {
                expect(variant.isFullyEvaluated).toStrictEqual(expectedValue);
            });
        });

        describe('getParameterValueByName', () => {
            it.each([
                {
                    variant: new EvaluatedEnumVariant(enumVariantWithParameters, undefined),
                    name: 'p',
                    expectedValue: UnknownEvaluatedNode,
                },
                {
                    variant: new EvaluatedEnumVariant(
                        enumVariantWithParameters,
                        new Map([[enumVariantParameter, NullConstant]]),
                    ),
                    name: 'q',
                    expectedValue: UnknownEvaluatedNode,
                },
                {
                    variant: new EvaluatedEnumVariant(
                        enumVariantWithParameters,
                        new Map([[enumVariantParameter, NullConstant]]),
                    ),
                    name: 'p',
                    expectedValue: NullConstant,
                },
            ])('should return the element at the given index (%#)', ({ variant, name, expectedValue }) => {
                expect(variant.getParameterValueByName(name)).toStrictEqual(expectedValue);
            });
        });
    });

    describe('EvaluatedList', () => {
        describe('isFullyEvaluated', () => {
            it.each([
                {
                    list: new EvaluatedList([]),
                    expectedValue: true,
                },
                {
                    list: new EvaluatedList([NullConstant]),
                    expectedValue: true,
                },
                {
                    list: new EvaluatedList([UnknownEvaluatedNode]),
                    expectedValue: false,
                },
            ])('should return the expected value (%#)', ({ list, expectedValue }) => {
                expect(list.isFullyEvaluated).toStrictEqual(expectedValue);
            });
        });

        describe('getElementByIndex', () => {
            it.each([
                {
                    list: new EvaluatedList([]),
                    index: 0,
                    expectedValue: UnknownEvaluatedNode,
                },
                {
                    list: new EvaluatedList([new IntConstant(1n)]),
                    index: 0,
                    expectedValue: new IntConstant(1n),
                },
            ])('should return the element at the given index (%#)', ({ list, index, expectedValue }) => {
                expect(list.getElementByIndex(index)).toStrictEqual(expectedValue);
            });
        });
    });

    describe('EvaluatedMap', () => {
        describe('isFullyEvaluated', () => {
            it.each([
                {
                    map: new EvaluatedMap([]),
                    expectedValue: true,
                },
                {
                    map: new EvaluatedMap([new EvaluatedMapEntry(NullConstant, NullConstant)]),
                    expectedValue: true,
                },
                {
                    map: new EvaluatedMap([new EvaluatedMapEntry(UnknownEvaluatedNode, NullConstant)]),
                    expectedValue: false,
                },
                {
                    map: new EvaluatedMap([new EvaluatedMapEntry(NullConstant, UnknownEvaluatedNode)]),
                    expectedValue: false,
                },
            ])('should return the expected value (%#)', ({ map, expectedValue }) => {
                expect(map.isFullyEvaluated).toStrictEqual(expectedValue);
            });
        });

        describe('getLastValueForKey', () => {
            it.each([
                {
                    map: new EvaluatedMap([]),
                    key: NullConstant,
                    expectedValue: UnknownEvaluatedNode,
                },
                {
                    map: new EvaluatedMap([new EvaluatedMapEntry(NullConstant, NullConstant)]),
                    key: NullConstant,
                    expectedValue: NullConstant,
                },
                {
                    map: new EvaluatedMap([
                        new EvaluatedMapEntry(NullConstant, NullConstant),
                        new EvaluatedMapEntry(NullConstant, new IntConstant(1n)),
                    ]),
                    key: NullConstant,
                    expectedValue: new IntConstant(1n),
                },
            ])('should return the last value for the given key (%#)', ({ map, key, expectedValue }) => {
                expect(map.getLastValueForKey(key)).toStrictEqual(expectedValue);
            });
        });
    });

    describe('EvaluatedNamedTuple', () => {
        describe('isFullyEvaluated', () => {
            it.each([
                {
                    tuple: new EvaluatedNamedTuple(new Map()),
                    expectedValue: true,
                },
                {
                    tuple: new EvaluatedNamedTuple(new Map([[result1, NullConstant]])),
                    expectedValue: true,
                },
                {
                    tuple: new EvaluatedNamedTuple(new Map([[result1, UnknownEvaluatedNode]])),
                    expectedValue: false,
                },
            ])('should return the expected value (%#)', ({ tuple, expectedValue }) => {
                expect(tuple.isFullyEvaluated).toStrictEqual(expectedValue);
            });
        });

        describe('getResultValueByName', () => {
            it.each([
                {
                    tuple: new EvaluatedNamedTuple(new Map([[blockLambdaResult1, NullConstant]])),
                    name: 'a',
                    expectedValue: NullConstant,
                },
                {
                    tuple: new EvaluatedNamedTuple(new Map([[result1, NullConstant]])),
                    name: 'b',
                    expectedValue: UnknownEvaluatedNode,
                },
            ])(
                'should return the substitution for the target of the given reference',
                ({ tuple, name, expectedValue }) => {
                    expect(tuple.getResultValueByName(name)).toStrictEqual(expectedValue);
                },
            );
        });

        describe('getResultValueByIndex', () => {
            it.each([
                {
                    tuple: new EvaluatedNamedTuple(new Map()),
                    index: 0,
                    expectedValue: UnknownEvaluatedNode,
                },
                {
                    tuple: new EvaluatedNamedTuple(new Map([[result1, NullConstant]])),
                    index: 0,
                    expectedValue: NullConstant,
                },
            ])('should return the substitution at the given index', ({ tuple, index, expectedValue }) => {
                expect(tuple.getResultValueByIndex(index)).toStrictEqual(expectedValue);
            });
        });

        describe('unwrap', () => {
            it('should return the single substitution if the tuple contains exactly one substitution', () => {
                const tuple = new EvaluatedNamedTuple(new Map([[result1, NullConstant]]));
                expect(tuple.unwrap()).toStrictEqual(NullConstant);
            });

            it('should return the tuple if it contains no substitutions', () => {
                const tuple = new EvaluatedNamedTuple(new Map([]));
                expect(tuple.unwrap()).toStrictEqual(tuple);
            });

            it('should return the tuple if it contains more than one substitution', () => {
                const tuple = new EvaluatedNamedTuple(
                    new Map([
                        [result1, NullConstant],
                        [result2, NullConstant],
                    ]),
                );
                expect(tuple.unwrap()).toStrictEqual(tuple);
            });
        });
    });
});

/**
 * Tests for {@link EvaluatedNode.isFullyEvaluated}.
 */
interface IsFullyEvaluatedTest {
    /**
     * The node to test.
     */
    node: EvaluatedNode;

    /**
     * Whether the node is fully evaluated.
     */
    expectedValue: boolean;
}
