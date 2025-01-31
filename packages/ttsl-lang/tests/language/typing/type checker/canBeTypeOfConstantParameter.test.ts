import { NodeFileSystem } from 'langium/node';
import { describe, expect, it } from 'vitest';
import { createTTSLServices } from '../../../../src/language/index.js';
import {
    AnyType,
    BooleanType,
    DictionaryType,
    FloatType,
    IntType,
    ListType,
    NothingType,
    StringType,
    Type,
    UnknownType,
} from '../../../../src/language/typing/model.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const typeChecker = services.types.TypeChecker;

describe('TTSLTypeChecker', async () => {
    const testCases: CanBeTypeOfConstantParameterTest[] = [
        {
            type: new AnyType(false),
            expected: true,
        },
        {
            type: new BooleanType(false),
            expected: true,
        },
        {
            type: new FloatType(false),
            expected: true,
        },
        {
            type: new IntType(false),
            expected: true,
        },
        {
            type: new ListType([new IntType(false)], false),
            expected: true,
        },
        {
            type: new DictionaryType([new StringType(false), new IntType(false)], false),
            expected: true,
        },
        {
            type: new NothingType(false),
            expected: true,
        },
        {
            type: new StringType(false),
            expected: true,
        },
        {
            type: UnknownType,
            expected: true,
        },
    ];

    describe.each(testCases)('isUsableAsTypeOfConstantParameter', ({ type, expected }) => {
        it(type.toString(), () => {
            expect(typeChecker.canBeTypeOfConstantParameter(type)).toBe(expected);
        });

        it(type.withExplicitNullability(true).toString, () => {
            expect(typeChecker.canBeTypeOfConstantParameter(type.withExplicitNullability(true))).toBe(expected);
        });
    });
});

/**
 * A test case for {@link TTSLTypeChecker.canBeTypeOfConstantParameter}.
 */
interface CanBeTypeOfConstantParameterTest {
    /**
     * The type to check.
     */
    type: Type;

    /**
     * Whether {@link type} is expected to be usable as the type of a constant parameter.
     */
    expected: boolean;
}
