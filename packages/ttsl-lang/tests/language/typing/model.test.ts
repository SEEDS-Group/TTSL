import { describe, expect, it } from 'vitest';
import {
    BooleanType,
    DictionaryType,
    IntType,
    ListType,
    StringType,
    Type,
    TypeParameterSubstitutions,
    UnknownType,
} from '../../../src/language/typing/model.js';
import type { EqualsTest, ToStringTest } from '../../helpers/testDescription.js';
import { expectEqualTypes } from '../../helpers/testAssertions.js';

describe('type model', async () => {
    const equalsTests: EqualsTest<Type>[] = [
        {
            value: () => new BooleanType(true),
            unequalValueOfSameType: () => new BooleanType(false),
            valueOfOtherType: () => UnknownType,
        },
    ];
    describe.each(equalsTests)('equals', ({ value, unequalValueOfSameType, valueOfOtherType }) => {
        it(`should return true if both types are the same instance (${value().constructor.name})`, () => {
            const typeInstance = value();
            expect(typeInstance.equals(typeInstance)).toBeTruthy();
        });

        it(`should return true if both types have the same values (${value().constructor.name})`, () => {
            expect(value().equals(value())).toBeTruthy();
        });

        if (unequalValueOfSameType) {
            it(`should return false if both types have different values (${value().constructor.name})`, () => {
                expect(value().equals(unequalValueOfSameType())).toBeFalsy();
            });
        }

        if (valueOfOtherType) {
            it(`should return false if the other type is an instance of another class (${
                value().constructor.name
            })`, () => {
                expect(value().equals(valueOfOtherType())).toBeFalsy();
            });
        }
    });

    const toStringTests: ToStringTest<Type>[] = [
        {
            value: UnknownType,
            expectedString: '$unknown',
        },
        {
            value: new BooleanType(false),
            expectedString: 'Boolean',
        },
        {
            value: new IntType(true),
            expectedString: 'Int?',
        },
    ];
    describe.each(toStringTests)('toString', ({ value, expectedString }) => {
        it(`should return the expected string representation (${value.constructor.name} -- ${value})`, () => {
            expect(value.toString()).toStrictEqual(expectedString);
        });
    });

    const substitutions1 = [new IntType(false)];
    const booleanType = new BooleanType(false);
    const substituteTypeParametersTest: SubstituteTypeParametersTest[] = [
        {
            type: new ListType([], false),
            substitutions: substitutions1,
            expectedType: new ListType([new IntType(false)], false),
        },
        {
            type: booleanType,
            substitutions: substitutions1,
            expectedType: booleanType,
        },
        {
            type: UnknownType,
            substitutions: substitutions1,
            expectedType: UnknownType,
        },
    ];
    describe.each(substituteTypeParametersTest)('substituteTypeParameters', ({ type, substitutions, expectedType }) => {
        it(`should return the expected value (${type.constructor.name} -- ${type})`, () => {
            const actual = type.substituteTypeParameters(substitutions);
            expectEqualTypes(actual, expectedType);
        });

        it(`should not change if no substitutions are passed (${type.constructor.name} -- ${type})`, () => {
            const actual = type.substituteTypeParameters([]);
            expectEqualTypes(actual, type);
        });
    });

    const withExplicitNullabilityTests: WithExplicitNullabilityTest[] = [
        {
            type: new IntType(false),
            isNullable: true,
            expectedType: new IntType(true),
        },
        {
            type: new IntType(true),
            isNullable: false,
            expectedType: new IntType(false),
        },
        {
            type: UnknownType,
            isNullable: true,
            expectedType: UnknownType,
        },
        {
            type: UnknownType,
            isNullable: false,
            expectedType: UnknownType,
        },
    ];
    describe.each(withExplicitNullabilityTests)('withExplicitNullability', ({ type, isNullable, expectedType }) => {
        it(`should return the expected value (${type.constructor.name} -- ${type})`, () => {
            const actual = type.withExplicitNullability(isNullable);
            expectEqualTypes(actual, expectedType);
        });
    });

    describe('ListAndDictionaryType', () => {
        describe('getTypeParameterTypeByIndex', () => {
            it.each([
                {
                    type: new ListType([UnknownType], false),
                    index: 0,
                    expectedType: UnknownType,
                },
                {
                    type: new DictionaryType([new IntType(false), new StringType(false)], false),
                    index: 1,
                    expectedType: new StringType(false),
                },
            ])('should return the type of the parameter at the given index (%#)', ({ type, index, expectedType }) => {
                const actual = type.getTypeParameterTypeByIndex(index);
                expectEqualTypes(actual, expectedType);
            });
        });
    });
});
/**
 * Tests for {@link Type.substituteTypeParameters}.
 */
interface SubstituteTypeParametersTest {
    /**
     * The type to test.
     */
    type: Type;

    /**
     * The type parameter substitutions to apply.
     */
    substitutions: TypeParameterSubstitutions;

    /**
     * The expected result.
     */
    expectedType: Type;
}

/**
 * Tests for {@link Type.withExplicitNullability}.
 */
interface WithExplicitNullabilityTest {
    /**
     * The type to test.
     */
    type: Type;

    /**
     * The new nullability.
     */
    isNullable: boolean;

    /**
     * The expected result.
     */
    expectedType: Type;
}
