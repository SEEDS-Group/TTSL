import { AstNode, EmptyFileSystem } from 'langium';
import { describe, expect, it } from 'vitest';
import { normalizeLineBreaks } from '../../../src/helpers/strings.js';
import {
    isTslFunction,
    isTslParameter,
    isTslResult,
    isTslTypeParameter,
} from '../../../src/language/generated/ast.js';
import { createTTSLServices } from '../../../src/language/index.js';
import { getNodeOfType } from '../../helpers/nodeFinder.js';
import { expandToString } from 'langium/generate';

const services = (await createTTSLServices(EmptyFileSystem, { omitBuiltins: true })).TTSL;
const documentationProvider = services.documentation.DocumentationProvider;
const testDocumentation = 'Lorem ipsum.';

describe('TTSLDocumentationProvider', () => {
    const testCases: DocumentationProviderTest[] = [
        {
            testName: 'module member',
            code: `
                /**
                 * ${testDocumentation}
                 */
                function F() {}
            `,
            predicate: isTslFunction,
            expectedDocumentation: testDocumentation,
        },
        {
            testName: 'documented parameter',
            code: `
                /**
                 * @param param ${testDocumentation}
                 */
                function myFunction(param: String) {}
            `,
            predicate: isTslParameter,
            expectedDocumentation: testDocumentation,
        },
        {
            testName: 'documented parameter (duplicate)',
            code: `
                /**
                 * @param param ${testDocumentation}
                 * @param param bla
                 */
                function myFunction(param: String) {}
            `,
            predicate: isTslParameter,
            expectedDocumentation: testDocumentation,
        },
        {
            testName: 'undocumented parameter',
            code: `
                /**
                 * @param param ${testDocumentation}
                 */
                function myFunction(param2: String) {}
            `,
            predicate: isTslParameter,
            expectedDocumentation: undefined,
        },
        {
            testName: 'parameter (no documentation on containing callable)',
            code: `
                function myFunction(p: Int) {}
            `,
            predicate: isTslParameter,
            expectedDocumentation: undefined,
        },/* 
        {
            testName: 'documented result',
            code: `
                /**
                 * @result res ${testDocumentation}
                 *
                function myFunction(): res: String {}
            `,
            predicate: isTslResult,
            expectedDocumentation: testDocumentation,
        }, 
        {
            testName: 'documented result (duplicate)',
            code: `
                /**
                 * @result ${testDocumentation}
                 * @result bla
                 
                function myFunction(): String {}
            `,
            predicate: isTslResult,
            expectedDocumentation: testDocumentation,
        },*/
        {
            testName: 'undocumented result',
            code: `
                /**
                 * @result ${testDocumentation}
                 */
                function myFunction(): String {}
            `,
            predicate: isTslResult,
            expectedDocumentation: undefined,
        },
        {
            testName: 'result (no documentation on containing callable)',
            code: `
                function myFunction(): Int {}
            `,
            predicate: isTslResult,
            expectedDocumentation: undefined,
        },/* 
        {
            testName: 'documented type parameter',
            code: `
                /**
                 * @typeParam T
                 *     ${testDocumentation}
                 *
                constant c: List<T> = [0, 1, 2];
            `,
            predicate: isTslTypeParameter,
            expectedDocumentation: testDocumentation,
        },
        {
            testName: 'documented type parameter (duplicate)',
            code: `
                /**
                 * @typeParam T ${testDocumentation}
                 * @typeParam T bla
                 *
                constant c: List<T> = [0, 1, 2];
            `,
            predicate: isTslTypeParameter,
            expectedDocumentation: testDocumentation,
        }, */
        {
            testName: 'undocumented type parameter',
            code: `
                /**
                 * @typeParam T
                 *     ${testDocumentation}
                 */
                constant c: List<T> = [0, 1, 2];
            `,
            predicate: isTslTypeParameter,
            expectedDocumentation: undefined,
        },
        {
            testName: 'custom tag rendering',
            code: `
                /**
                 * ${testDocumentation}
                 *
                 * @param param ${testDocumentation}
                 * @result result ${testDocumentation}
                 * @since 1.0.0
                 */
                function myFunction(param: String): String {}
            `,
            predicate: isTslFunction,
            expectedDocumentation: expandToString`
                Lorem ipsum.

                **@param** *param* — Lorem ipsum.

                **@result** *result* — Lorem ipsum.

                **@since** — 1.0.0
            `,
        },
    ];

    it.each(testCases)('$testName', async ({ code, predicate, expectedDocumentation }) => {
        const node = await getNodeOfType(services, code, predicate);
        const normalizedActual = normalizeLineBreaks(documentationProvider.getDocumentation(node));
        const normalizedExpected = normalizeLineBreaks(expectedDocumentation);
        expect(normalizedActual).toStrictEqual(normalizedExpected);
    });

    it('should resolve links', async () => {
        const code = `
            /**
             * {@link myFunction2}
             */
            function myFunction1(){}

            function myFunction2(){}
        `;
        const node = await getNodeOfType(services, code, isTslFunction);
        expect(documentationProvider.getDocumentation(node)).toMatch(/\[myFunction2\]\(.*\)/u);
    });
});

/**
 * A description of a test case for the documentation provider.
 */
interface DocumentationProviderTest {
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
     * The expected documentation.
     */
    expectedDocumentation: string | undefined;
}
