import { NodeFileSystem } from 'langium/node';
import { describe, expect, it } from 'vitest';
import {
    isTslAttribute,
    isTslClass,
    isTslFunction,
    TslClass,
    type TslClassMember,
} from '../../../src/language/generated/ast.js';
import { createSafeDsServices, getClassMembers } from '../../../src/language/index.js';
import { getNodeOfType } from '../../helpers/nodeFinder.js';

const services = (await createSafeDsServices(NodeFileSystem)).SafeDs;
const builtinClasses = services.builtins.Classes;
const classHierarchy = services.types.ClassHierarchy;

describe('SafeDsClassHierarchy', async () => {
    describe('isEqualToOrSubclassOf', () => {
        const testCases = [
            {
                testName: 'should return false if node is undefined',
                node: () => undefined,
                other: () => builtinClasses.Any,
                expected: false,
            },
            {
                testName: 'should return false if other is undefined',
                node: () => builtinClasses.Nothing,
                other: () => undefined,
                expected: false,
            },
            {
                testName: 'should return false if node and other are undefined',
                node: () => undefined,
                other: () => undefined,
                expected: false,
            },
            {
                testName: 'should return true if node is Nothing',
                node: () => builtinClasses.Nothing,
                other: () => builtinClasses.Any,
                expected: true,
            },
            {
                testName: 'should return true if node and other are equal',
                node: () => builtinClasses.Any,
                other: () => builtinClasses.Any,
                expected: true,
            },
            {
                testName: 'should return true if node is a subclass of other',
                node: () => builtinClasses.Int,
                other: () => builtinClasses.Any,
                expected: true,
            },
        ];

        it.each(testCases)('$testName', async ({ node, other, expected }) => {
            expect(classHierarchy.isEqualToOrSubclassOf(node(), other())).toStrictEqual(expected);
        });
    });

    describe('streamProperSuperclasses', () => {
        const properSuperclassesNames = (node: TslClass | undefined) =>
            classHierarchy
                .streamProperSuperclasses(node)
                .map((clazz) => clazz.name)
                .toArray();

        it('should return an empty stream if passed undefined', () => {
            expect(properSuperclassesNames(undefined)).toStrictEqual([]);
        });

        const testCases = [
            {
                testName: 'should return "Any" if the class has no parent types',
                code: `
                    class A
                `,
                expected: ['Any'],
            },
            {
                testName: 'should return "Any" if the first parent type is not a class',
                code: `
                    class A sub E
                    enum E
                `,
                expected: ['Any'],
            },
            {
                testName: 'should return the superclasses of a class (no cycle, implicit any)',
                code: `
                    class A sub B
                    class B
                `,
                expected: ['B', 'Any'],
            },
            {
                testName: 'should return the superclasses of a class (no cycle, explicit any)',
                code: `
                    class A sub Any
                `,
                expected: ['Any'],
            },
            {
                testName: 'should return the superclasses of a class (cycle)',
                code: `
                    class A sub B
                    class B sub C
                    class C sub A
                `,
                expected: ['B', 'C', 'A', 'Any'],
            },
            {
                testName: 'should only consider the first parent type',
                code: `
                    class A sub B, C
                    class B
                    class C
                `,
                expected: ['B', 'Any'],
            },
        ];

        it.each(testCases)('$testName', async ({ code, expected }) => {
            const firstClass = await getNodeOfType(services, code, isTslClass);
            expect(properSuperclassesNames(firstClass)).toStrictEqual(expected);
        });
    });

    describe('streamSuperclassMembers', () => {
        const superclassMemberNames = (node: TslClass | undefined) =>
            classHierarchy
                .streamSuperclassMembers(node)
                .map((member) => member.name)
                .toArray();

        it('should return an empty stream if passed undefined', () => {
            expect(superclassMemberNames(undefined)).toStrictEqual([]);
        });

        const testCases = [
            {
                testName: 'should return the members of the parent type',
                code: `
                    class A {
                        attr a: Int
                        fun f()
                    }

                    class B sub A
                `,
                index: 1,
                expected: ['a', 'f'],
            },
            {
                testName: 'should only consider members of the first parent type',
                code: `
                    class A {
                        attr a: Int
                        fun f()
                    }

                    class B {
                        attr b: Int
                        fun g()
                    }

                    class C sub A, B
                `,
                index: 2,
                expected: ['a', 'f'],
            },
            {
                testName: 'should return members of all superclasses',
                code: `
                    class A {
                        attr a: Int
                        fun f()
                    }

                    class B sub A {
                        attr b: Int
                        fun g()
                    }

                    class C sub B
                `,
                index: 2,
                expected: ['b', 'g', 'a', 'f'],
            },
        ];

        it.each(testCases)('$testName', async ({ code, index, expected }) => {
            const firstClass = await getNodeOfType(services, code, isTslClass, index);
            const anyMembers = getClassMembers(builtinClasses.Any).map((member) => member.name);
            expect(superclassMemberNames(firstClass)).toStrictEqual(expected.concat(anyMembers));
        });
    });

    describe('getOverriddenMember', () => {
        const isUndefined = (result: unknown) => result === undefined;

        const testCases: GetOverriddenMemberTest[] = [
            {
                testName: 'global function',
                code: `
                    fun f()
                `,
                memberPredicate: isTslFunction,
                index: 0,
                expectedResultPredicate: isUndefined,
            },
            {
                testName: 'attribute, no superclass',
                code: `
                    class A {
                        attr a: Int
                    }
                `,
                memberPredicate: isTslAttribute,
                index: 0,
                expectedResultPredicate: isUndefined,
            },
            {
                testName: 'method, no superclass',
                code: `
                    class A {
                        fun f()
                    }
                `,
                memberPredicate: isTslFunction,
                index: 0,
                expectedResultPredicate: isUndefined,
            },
            {
                testName: 'attribute, superclass, no match',
                code: `
                    class A sub B {
                        attr a: Int
                    }

                    class B {
                        attr b: Int
                    }
                `,
                memberPredicate: isTslAttribute,
                index: 0,
                expectedResultPredicate: isUndefined,
            },
            {
                testName: 'method, superclass, no match',
                code: `
                    class A sub B {
                        fun f()
                    }

                    class B {
                        fun g()
                    }
                `,
                memberPredicate: isTslFunction,
                index: 0,
                expectedResultPredicate: isUndefined,
            },
            {
                testName: 'static attribute',
                code: `
                    class A sub B {
                        static attr a: Int
                    }

                    class B {
                        static attr a: Int
                    }
                `,
                memberPredicate: isTslAttribute,
                index: 0,
                expectedResultPredicate: isUndefined,
            },
            {
                testName: 'static method',
                code: `
                    class A sub B {
                        static fun f()
                    }

                    class B {
                        static fun f()
                    }
                `,
                memberPredicate: isTslFunction,
                index: 0,
                expectedResultPredicate: isUndefined,
            },
            {
                testName: 'attribute, superclass, match but static',
                code: `
                    class A sub B {
                        attr a: Int
                    }

                    class B {
                        static attr a: Int
                    }
                `,
                memberPredicate: isTslAttribute,
                index: 0,
                expectedResultPredicate: isUndefined,
            },
            {
                testName: 'method, superclass, match but static',
                code: `
                    class A sub B {
                        fun f()
                    }

                    class B {
                        static fun f()
                    }
                `,
                memberPredicate: isTslFunction,
                index: 0,
                expectedResultPredicate: isUndefined,
            },
            {
                testName: 'attribute, superclass, match',
                code: `
                    class A sub B {
                        attr a: Int
                    }

                    class B {
                        attr a: Int
                    }
                `,
                memberPredicate: isTslAttribute,
                index: 0,
                expectedResultPredicate: isTslAttribute,
            },
            {
                testName: 'method, superclass, match',
                code: `
                    class A sub B {
                        fun f()
                    }

                    class B {
                        fun f()
                    }
                `,
                memberPredicate: isTslFunction,
                index: 0,
                expectedResultPredicate: isTslFunction,
            },
            {
                testName: 'attribute, previous member with same name',
                code: `
                    class A sub B {
                        attr a: Int
                        attr a: Int
                    }

                    class B {
                        attr a: Int
                    }
                `,
                memberPredicate: isTslAttribute,
                index: 1,
                expectedResultPredicate: isUndefined,
            },
            {
                testName: 'method, previous member with same name',
                code: `
                    class A sub B {
                        fun f()
                        fun f()
                    }

                    class B {
                        fun f()
                    }
                `,
                memberPredicate: isTslFunction,
                index: 1,
                expectedResultPredicate: isUndefined,
            },
        ];

        it.each(testCases)(
            'should return the overridden member or undefined ($testName)',
            async ({ code, memberPredicate, index, expectedResultPredicate }) => {
                const member = await getNodeOfType(services, code, memberPredicate, index);
                expect(classHierarchy.getOverriddenMember(member)).toSatisfy(expectedResultPredicate);
            },
        );

        it('should return undefined if passed undefined', () => {
            expect(classHierarchy.getOverriddenMember(undefined)).toBeUndefined();
        });
    });
});

/**
 * A test case for {@link ClassHierarchy.getOverriddenMember}.
 */
interface GetOverriddenMemberTest {
    /**
     * A short description of the test case.
     */
    testName: string;

    /**
     * The code to parse.
     */
    code: string;

    /**
     * A predicate that matches the member that should be used as input.
     */
    memberPredicate: (value: unknown) => value is TslClassMember;

    /**
     * The index of the member to use as input.
     */
    index: number;

    /**
     * A predicate that matches the expected result.
     */
    expectedResultPredicate: (value: unknown) => boolean;
}
