import { AssertionError } from 'assert';
import { AstNode, EmptyFileSystem } from 'langium';
import { describe, expect, it } from 'vitest';
import {
    isTslAnnotation,
    isTslAttribute,
    isTslBlockLambdaResult,
    isTslEnumVariant,
    isTslExpressionStatement,
    isTslParameter,
    isTslPlaceholder,
    isTslResult,
    isTslTypeParameter,
} from '../../../src/language/generated/ast.js';
import { createTTSLServices } from '../../../src/language/index.js';
import { getNodeOfType } from '../../helpers/nodeFinder.js';

const services = (await createTTSLServices(EmptyFileSystem, { omitBuiltins: true })).TTSL;
const commentProvider = services.documentation.CommentProvider;
const testComment = '/* test */';

describe('TTSLCommentProvider', () => {
    const testCases: CommentProviderTest[] = [
        {
            testName: 'commented module member (without annotations)',
            code: `
                ${testComment}
                annotation MyAnnotation
            `,
            predicate: isTslAnnotation,
            expectedComment: testComment,
        },
        {
            testName: 'commented module member (with annotations, missing package)',
            code: `
                ${testComment}
                @Test
                annotation MyAnnotation
            `,
            predicate: isTslAnnotation,
            expectedComment: undefined,
        },
        {
            testName: 'commented module member (with annotations, with package)',
            code: `
                package test

                ${testComment}
                @Test
                annotation MyAnnotation
            `,
            predicate: isTslAnnotation,
            expectedComment: testComment,
        },
        {
            testName: 'uncommented module member',
            code: `
                annotation MyAnnotation
            `,
            predicate: isTslAnnotation,
            expectedComment: undefined,
        },
        {
            testName: 'commented class member (without annotations)',
            code: `
                class MyClass {
                    ${testComment}
                    attr a: Int
                }
            `,
            predicate: isTslAttribute,
            expectedComment: testComment,
        },
        {
            testName: 'commented class member (with annotations)',
            code: `
                class MyClass {
                    ${testComment}
                    @Test
                    attr a: Int
                }
            `,
            predicate: isTslAttribute,
            expectedComment: testComment,
        },
        {
            testName: 'uncommented class member',
            code: `
                class MyClass {
                    attr a: Int
                }
            `,
            predicate: isTslAttribute,
            expectedComment: undefined,
        },
        {
            testName: 'commented enum variant (without annotations)',
            code: `
                enum MyEnum {
                    ${testComment}
                    MyEnumVariant
                }
            `,
            predicate: isTslEnumVariant,
            expectedComment: testComment,
        },
        {
            testName: 'commented enum variant (with annotations)',
            code: `
                enum MyEnum {
                    ${testComment}
                    @Test
                    MyEnumVariant
                }
            `,
            predicate: isTslEnumVariant,
            expectedComment: testComment,
        },
        {
            testName: 'uncommented enum variant',
            code: `
                enum MyEnum {
                    MyEnumVariant
                }
            `,
            predicate: isTslEnumVariant,
            expectedComment: undefined,
        },
        {
            testName: 'commented block lambda result',
            code: `
                pipeline myPipeline {
                    () {
                        ${testComment}
                        yield r = 1;
                    }
                }
            `,
            predicate: isTslBlockLambdaResult,
            expectedComment: undefined,
        },
        {
            testName: 'uncommented block lambda result',
            code: `
                pipeline myPipeline {
                    () {
                        yield r = 1;
                    }
                }
            `,
            predicate: isTslBlockLambdaResult,
            expectedComment: undefined,
        },
        {
            testName: 'commented parameter',
            code: `
                segment mySegment(${testComment} p: Int) {}
            `,
            predicate: isTslParameter,
            expectedComment: undefined,
        },
        {
            testName: 'uncommented parameter',
            code: `
                segment mySegment(p: Int) {}
            `,
            predicate: isTslParameter,
            expectedComment: undefined,
        },
        {
            testName: 'commented placeholder',
            code: `
                segment mySegment() {
                    ${testComment}
                    val p = 1;
                }
            `,
            predicate: isTslPlaceholder,
            expectedComment: undefined,
        },
        {
            testName: 'uncommented placeholder',
            code: `
                segment mySegment(p: Int) {
                    val p = 1;
                }
            `,
            predicate: isTslPlaceholder,
            expectedComment: undefined,
        },
        {
            testName: 'commented result',
            code: `
                segment mySegment() -> (${testComment} r: Int) {}
            `,
            predicate: isTslResult,
            expectedComment: undefined,
        },
        {
            testName: 'uncommented result',
            code: `
                segment mySegment() -> (r: Int) {}
            `,
            predicate: isTslResult,
            expectedComment: undefined,
        },
        {
            testName: 'commented type parameter',
            code: `
                class MyClass<${testComment} T>
            `,
            predicate: isTslTypeParameter,
            expectedComment: undefined,
        },
        {
            testName: 'uncommented type parameter',
            code: `
                class MyClass<T>
            `,
            predicate: isTslTypeParameter,
            expectedComment: undefined,
        },
        {
            testName: 'commented not-a-declaration',
            code: `
                segment mySegment(p: Int) {
                    ${testComment}
                    f();
                }
            `,
            predicate: isTslExpressionStatement,
            expectedComment: undefined,
        },
        {
            testName: 'uncommented not-a-declaration',
            code: `
                segment mySegment(p: Int) {
                    f();
                }
            `,
            predicate: isTslExpressionStatement,
            expectedComment: undefined,
        },
    ];

    it.each(testCases)('$testName', async ({ code, predicate, expectedComment }) => {
        const node = await getNodeOfType(services, code, predicate);
        if (!node) {
            throw new AssertionError({ message: 'Node not found.' });
        }

        expect(commentProvider.getComment(node)).toStrictEqual(expectedComment);
    });
});

/**
 * A description of a test case for the comment provider.
 */
interface CommentProviderTest {
    /**
     * A short description of the test case.
     */
    testName: string;

    /**
     * The code to test.
     */
    code: string;

    /**
     * A predicate to find the node to test.
     */
    predicate: (node: unknown) => node is AstNode;

    /**
     * The expected comment.
     */
    expectedComment: string | undefined;
}
