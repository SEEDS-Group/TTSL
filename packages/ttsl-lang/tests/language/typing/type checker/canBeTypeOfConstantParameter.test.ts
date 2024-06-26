import { NodeFileSystem } from 'langium/node';
import { describe, expect, it } from 'vitest';
import { isTslClass, isTslEnum, isTslModule } from '../../../../src/language/generated/ast.js';
import { createSafeDsServices, getEnumVariants, getModuleMembers } from '../../../../src/language/index.js';
import { ClassType, EnumType, EnumVariantType, Type, UnknownType } from '../../../../src/language/typing/model.js';
import { getNodeOfType } from '../../../helpers/nodeFinder.js';

const services = (await createSafeDsServices(NodeFileSystem)).SafeDs;
const coreTypes = services.types.CoreTypes;
const factory = services.types.TypeFactory;
const typeChecker = services.types.TypeChecker;
const typeComputer = services.types.TypeComputer;

const code = `
    class MyClass

    enum ConstantEnum {
        Variant1
        Variant2(const param: Int)
    }

    enum NormalEnum {
        Variant1
        Variant2(param: Int)
    }
`;
const module = await getNodeOfType(services, code, isTslModule);
const classes = getModuleMembers(module).filter(isTslClass);
const myClassType = typeComputer.computeType(classes[0]) as ClassType;

const enums = getModuleMembers(module).filter(isTslEnum);
const constantEnum = enums[0];
const normalEnum = enums[1];
const constantEnumType = typeComputer.computeType(constantEnum) as EnumType;
const normalEnumType = typeComputer.computeType(normalEnum) as EnumType;

const constantEnumVariantType = typeComputer.computeType(getEnumVariants(constantEnum)[1]) as EnumVariantType;
const normalEnumVariantType = typeComputer.computeType(getEnumVariants(normalEnum)[1]) as EnumVariantType;

describe('SafeDsTypeChecker', async () => {
    const testCases: CanBeTypeOfConstantParameterTest[] = [
        {
            type: coreTypes.Any,
            expected: false,
        },
        {
            type: coreTypes.Boolean,
            expected: true,
        },
        {
            type: coreTypes.Float,
            expected: true,
        },
        {
            type: coreTypes.Int,
            expected: true,
        },
        {
            type: coreTypes.List(coreTypes.Int),
            expected: true,
        },
        {
            type: coreTypes.Map(coreTypes.String, coreTypes.Int),
            expected: true,
        },
        {
            type: coreTypes.Nothing,
            expected: true,
        },
        {
            type: coreTypes.String,
            expected: true,
        },
        {
            type: myClassType,
            expected: false,
        },
        {
            type: constantEnumType,
            expected: true,
        },
        {
            type: normalEnumType,
            expected: false,
        },
        {
            type: constantEnumVariantType,
            expected: true,
        },
        {
            type: normalEnumVariantType,
            expected: false,
        },
        {
            type: factory.createLiteralType(),
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
 * A test case for {@link SafeDsTypeChecker.canBeTypeOfConstantParameter}.
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
