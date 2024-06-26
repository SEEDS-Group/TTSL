import { NodeFileSystem } from 'langium/node';
import { describe, expect, it } from 'vitest';
import { isTslParameter } from '../../../src/language/generated/ast.js';
import {
    EndlessRecursion,
    FileRead,
    FileWrite,
    type ImpurityReason,
    OtherImpurityReason,
    PotentiallyImpureParameterCall,
    UnknownCallableCall,
} from '../../../src/language/purity/model.js';
import { getNodeOfType } from '../../helpers/nodeFinder.js';
import { type EqualsTest, ToStringTest } from '../../helpers/testDescription.js';
import { createSafeDsServices } from '../../../src/language/index.js';

const services = (await createSafeDsServices(NodeFileSystem)).SafeDs;
const parameter = await getNodeOfType(services, 'fun f(p: Int)', isTslParameter);

describe('purity model', async () => {
    const equalsTests: EqualsTest<ImpurityReason>[] = [
        {
            value: () => new FileRead(undefined),
            unequalValueOfSameType: () => new FileRead('test.txt'),
            valueOfOtherType: () => new FileWrite(undefined),
        },
        {
            value: () => new FileWrite('test.txt'),
            unequalValueOfSameType: () => new FileWrite(undefined),
            valueOfOtherType: () => new FileRead('test.txt'),
        },
        {
            value: () => new PotentiallyImpureParameterCall(undefined),
            unequalValueOfSameType: () => new PotentiallyImpureParameterCall(parameter),
            valueOfOtherType: () => new FileRead('test.txt'),
        },
        {
            value: () => UnknownCallableCall,
            valueOfOtherType: () => EndlessRecursion,
        },
        {
            value: () => EndlessRecursion,
            valueOfOtherType: () => OtherImpurityReason,
        },
        {
            value: () => OtherImpurityReason,
            valueOfOtherType: () => new FileRead('test.txt'),
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

    const toStringTests: ToStringTest<ImpurityReason>[] = [
        {
            value: new FileRead(undefined),
            expectedString: 'File read from ?',
        },
        {
            value: new FileRead('test.txt'),
            expectedString: 'File read from "test.txt"',
        },
        {
            value: new FileRead(parameter),
            expectedString: 'File read from f.p',
        },
        {
            value: new FileWrite(undefined),
            expectedString: 'File write to ?',
        },
        {
            value: new FileWrite('test.txt'),
            expectedString: 'File write to "test.txt"',
        },
        {
            value: new FileWrite(parameter),
            expectedString: 'File write to f.p',
        },
        {
            value: new PotentiallyImpureParameterCall(undefined),
            expectedString: 'Potentially impure call of ?',
        },
        {
            value: new PotentiallyImpureParameterCall(parameter),
            expectedString: 'Potentially impure call of f.p',
        },
        {
            value: UnknownCallableCall,
            expectedString: 'Unknown callable call',
        },
        {
            value: EndlessRecursion,
            expectedString: 'Endless recursion',
        },
        {
            value: OtherImpurityReason,
            expectedString: 'Other',
        },
    ];

    describe.each(toStringTests)('toString', ({ value, expectedString }) => {
        it(`should return the expected string representation (${value.constructor.name} -- ${value})`, () => {
            expect(value.toString()).toStrictEqual(expectedString);
        });
    });
});
