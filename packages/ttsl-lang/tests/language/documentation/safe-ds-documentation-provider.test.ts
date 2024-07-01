import { AstNode, EmptyFileSystem } from 'langium';
import { describe, expect, it } from 'vitest';
import { normalizeLineBreaks } from '../../../src/helpers/strings.js';
import {
    isTslAnnotation,
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
                annotation MyAnnotation
            `,
            predicate: isTslAnnotation,
            expectedDocumentation: testDocumentation,
        },
        {
            testName: 'documented parameter',
            code: `
                /**
                 * @param param ${testDocumentation}
                 */
                fun myFunction(param: String)
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
                fun myFunction(param: String)
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
                fun myFunction(param2: String)
            `,
            predicate: isTslParameter,
            expectedDocumentation: undefined,
        },
        {
            testName: 'parameter (no documentation on containing callable)',
            code: `
                fun myFunction(p: Int)
            `,
            predicate: isTslParameter,
            expectedDocumentation: undefined,
        },
        {
            testName: 'documented result',
            code: `
                /**
                 * @result res ${testDocumentation}
                 */
                fun myFunction() -> (res: String)
            `,
            predicate: isTslResult,
            expectedDocumentation: testDocumentation,
        },
        {
            testName: 'documented result (duplicate)',
            code: `
                /**
                 * @result res ${testDocumentation}
                 * @result res bla
                 */
                fun myFunction() -> (res: String)
            `,
            predicate: isTslResult,
            expectedDocumentation: testDocumentation,
        },
        {
            testName: 'undocumented result',
            code: `
                /**
                 * @result res ${testDocumentation}
                 */
                fun myFunction() -> (res2: String)
            `,
            predicate: isTslResult,
            expectedDocumentation: undefined,
        },
        {
            testName: 'result (no documentation on containing callable)',
            code: `
                fun myFunction() -> r: Int
            `,
            predicate: isTslResult,
            expectedDocumentation: undefined,
        },
        {
            testName: 'documented type parameter',
            code: `
                /**
                 * @typeParam T
                 *     ${testDocumentation}
                 */
                class MyClass<T>
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
                 */
                class MyClass<T>
            `,
            predicate: isTslTypeParameter,
            expectedDocumentation: testDocumentation,
        },
        {
            testName: 'undocumented type parameter',
            code: `
                /**
                 * @typeParam T
                 *     ${testDocumentation}
                 */
                class MyClass<T2>
            `,
            predicate: isTslTypeParameter,
            expectedDocumentation: undefined,
        },
        {
            testName: 'type parameter (no documentation on containing callable)',
            code: `
                fun myFunction<T>()
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
                 * @typeParam T ${testDocumentation}
                 * @since 1.0.0
                 */
                fun myFunction<T>(param: String) -> result: String
            `,
            predicate: isTslFunction,
            expectedDocumentation: expandToString`
                Lorem ipsum.

                **@param** *param* — Lorem ipsum.

                **@result** *result* — Lorem ipsum.

                **@typeParam** *T* — Lorem ipsum.

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
            fun myFunction1()

            fun myFunction2()
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
