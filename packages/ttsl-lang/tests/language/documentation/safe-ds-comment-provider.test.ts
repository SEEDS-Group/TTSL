import { AssertionError } from 'assert';
import { AstNode, EmptyFileSystem } from 'langium';
import { describe, expect, it } from 'vitest';
import {
    isTslExpressionStatement,
    isTslFunction,
    isTslLocalVariable,
    isTslParameter,
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
            testName: 'commented module member (missing package)',
            code: `
                ${testComment}
                function F(){}
            `,
            predicate: isTslFunction,
            expectedComment: testComment,
        },
        {
            testName: 'commented module member (with annotations, with package)',
            code: `
                package test

                ${testComment}
                function F(){}
            `,
            predicate: isTslFunction,
            expectedComment: testComment,
        },
        {
            testName: 'uncommented module member',
            code: `
                function F(){}
            `,
            predicate: isTslFunction,
            expectedComment: undefined,
        },
        {
            testName: 'commented function member',
            code: `
                function F() {
                    ${testComment}
                    var a: Int = 0;
                }
            `,
            predicate: isTslLocalVariable,
            expectedComment: undefined,
        },
        {
            testName: 'uncommented function member',
            code: `
                function F() {
                    var a: Int = 0;
                }
            `,
            predicate: isTslLocalVariable,
            expectedComment: undefined,
        },
        {
            testName: 'commented parameter',
            code: `
                function F(${testComment} p: Int) {}
            `,
            predicate: isTslParameter,
            expectedComment: undefined,
        },
        {
            testName: 'uncommented parameter',
            code: `
                function F(p: Int) {}
            `,
            predicate: isTslParameter,
            expectedComment: undefined,
        },
        {
            testName: 'commented result',
            code: `
                function F(): ${testComment} Int {}
            `,
            predicate: isTslResult,
            expectedComment: undefined,
        },
        {
            testName: 'uncommented result',
            code: `
                function F(): Int {}
            `,
            predicate: isTslResult,
            expectedComment: undefined,
        },
        {
            testName: 'commented type parameter',
            code: `
                constant c: List<${testComment} Int> = [0, 1];
            `,
            predicate: isTslTypeParameter,
            expectedComment: undefined,
        },
        {
            testName: 'uncommented type parameter',
            code: `
                constant c: List<Int> = [0, 1];
            `,
            predicate: isTslTypeParameter,
            expectedComment: undefined,
        },
        {
            testName: 'commented not-a-declaration',
            code: `
                function F(p: Int) {
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
                function F(p: Int) {
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

        console.log(node.$type + ': ' + commentProvider.getComment(node) + '\n');
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
