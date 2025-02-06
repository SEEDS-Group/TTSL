import { describe, expect, it } from 'vitest';
import { parseHelper } from 'langium/test';
import { SignatureHelp } from 'vscode-languageserver';
import { NodeFileSystem } from 'langium/node';
import { findTestRanges } from '../../helpers/testRanges.js';
import { createTTSLServices } from '../../../src/language/index.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const signatureHelpProvider = services.lsp.SignatureHelp!;
const parse = parseHelper(services);

describe('TTSLSignatureHelpProvider', async () => {
    it('should always select the first signature', async () => {
        const code = `
            function f(p: Int) {}

            function myFunction () {
                f(»«);
            }
        `;

        const actualSignatureHelp = await getActualSignatureHelp(code);
        expect(actualSignatureHelp?.activeSignature).toBe(0);
    });

    it.each([
        {
            testName: 'empty argument list',
            code: `
                function f(p: Int){}

                function myFunction () {
                    f(»«);
                }
            `,
            expectedIndex: 0,
        },
        {
            testName: 'before comma',
            code: `
                function f(p: Int) {}

                function myFunction () {
                    f(»«, );
                }
            `,
            expectedIndex: 0,
        },
        {
            testName: 'after comma',
            code: `
                function f(p: Int) {}

                function myFunction () {
                    f(1, »«);
                }
            `,
            expectedIndex: 1,
        },
    ])('should select the correct parameter ($testName)', async ({ code, expectedIndex }) => {
        const actualSignatureHelp = await getActualSignatureHelp(code);
        expect(actualSignatureHelp?.activeParameter).toBe(expectedIndex);
    });

    it.each([
        {
            testName: 'not in an abstract call',
            code: '»«',
            expectedSignature: undefined,
        },
        {
            testName: 'unresolved callable',
            code: `
                function myFunction () {
                    f(»«);
                }
            `,
            expectedSignature: undefined,
        },
        {
            testName: 'call (function)',
            code: `
                /**
                 * Lorem ipsum.
                 */
                function f(p: Int) {}

                function myFunction () {
                    f(»«);
                }
            `,
            expectedSignature: [
                {
                    label: 'f(p: Int): $unknown',
                    documentation: {
                        kind: 'markdown',
                        value: 'Lorem ipsum.',
                    },
                    parameters: [
                        {
                            label: 'p: Int',
                        },
                    ],
                },
            ],
        },
        {
            testName: 'optional parameter',
            code: `
                function f(p: Int = 0): Int {}

                function myFunction () {
                    f(»«);
                }
            `,
            expectedSignature: [
                {
                    label: 'f(p?: Int): Int',
                    documentation: undefined,
                    parameters: [
                        {
                            label: 'p?: Int',
                        },
                    ],
                },
            ],
        },
    ])('should assign the correct signature ($testName)', async ({ code, expectedSignature }) => {
        const actualSignatureHelp = await getActualSignatureHelp(code);
        expect(actualSignatureHelp?.signatures).toStrictEqual(expectedSignature);
    });
});

const getActualSignatureHelp = async (code: string): Promise<SignatureHelp | undefined> => {
    const document = await parse(code);
    const testRangesResult = findTestRanges(code, document.uri);
    if (testRangesResult.isErr) {
        throw new Error(testRangesResult.error.message);
    } else if (testRangesResult.value.length === 0) {
        throw new Error('No test ranges found.');
    }

    const position = testRangesResult.value[0]!.start;
    return signatureHelpProvider.provideSignatureHelp(document, {
        textDocument: document.textDocument,
        position,
    });
};
