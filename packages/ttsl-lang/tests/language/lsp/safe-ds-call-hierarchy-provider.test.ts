import { NodeFileSystem } from 'langium/node';
import { parseHelper } from 'langium/test';
import { describe, expect, it } from 'vitest';
import { type CallHierarchyItem } from 'vscode-languageserver';
import { findTestRanges } from '../../helpers/testRanges.js';
import { createTTSLServices } from '../../../src/language/index.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const callHierarchyProvider = services.lsp.CallHierarchyProvider!;
const parse = parseHelper(services);

describe('TTSLCallHierarchyProvider', async () => {
    describe('incomingCalls', () => {
        const testCases: IncomingCallTest[] = [
            {
                testName: 'unused',
                code: `function »«f() {}`,
                expectedIncomingCalls: undefined,
            },
            {
                testName: 'single caller, single call',
                code: `
                    function »«C() {}
                    function D() {}

                    function myFunction () {
                        C();
                        D();
                    }
                `,
                expectedIncomingCalls: [
                    {
                        fromName: 'myFunction',
                        fromRangesLength: 1,
                    },
                ],
            },
            {
                testName: 'single caller, multiple calls',
                code: `
                    function »«C() {}
                    function D() {}

                    function myFunction () {
                        C();
                        C();
                        C();
                        D();
                    }
                `,
                expectedIncomingCalls: [
                    {
                        fromName: 'myFunction',
                        fromRangesLength: 3,
                    },
                ],
            },
            {
                testName: 'multiple callers',
                code: `
                    function »«C(): Int {}
                    function D() {}

                    function myFunction () {
                        C();
                        C();
                        D();
                    }

                   function myFunction2(param1: Int = C()) {
                       C();
                       C();
                       D();
                   }
                `,
                expectedIncomingCalls: [
                    {
                        fromName: 'myFunction',
                        fromRangesLength: 2,
                    },
                    {
                        fromName: 'myFunction2',
                        fromRangesLength: 3,
                    },
                ],
            },
            {
                testName: 'only referenced',
                code: `
                    function »«C() {}

                    function f() {
                        C;
                    }
                `,
                expectedIncomingCalls: undefined,
            },
        ];

        it.each(testCases)('should list all incoming calls ($testName)', async ({ code, expectedIncomingCalls }) => {
            const result = await getActualSimpleIncomingCalls(code);
            expect(result).toStrictEqual(expectedIncomingCalls);
        });
    });

    describe('outgoingCalls', () => {
        const testCases: OutgoingCallTest[] = [
            {
                testName: 'no calls',
                code: `function »«p() {}`,
                expectedOutgoingCalls: undefined,
            },
            {
                testName: 'single callee, single call',
                code: `
                    function f() {}

                    function »«p() {
                        f();
                    }
                `,
                expectedOutgoingCalls: [
                    {
                        toName: 'f',
                        fromRangesLength: 1,
                    },
                ],
            },
            {
                testName: 'single callee, multiple calls',
                code: `
                    function f() {}

                    function »«p() {
                        f();
                        f();
                        (f());
                    }
                `,
                expectedOutgoingCalls: [
                    {
                        toName: 'f',
                        fromRangesLength: 3,
                    },
                ],
            },
            {
                testName: 'multiple callees',
                code: `
                    function f() {}
                    function g() {}

                    function »«p() {
                        f();
                        f();
                        g();
                    }
                `,
                expectedOutgoingCalls: [
                    {
                        toName: 'f',
                        fromRangesLength: 2,
                    },
                    {
                        toName: 'g',
                        fromRangesLength: 1,
                    },
                ],
            },
            {
                testName: 'only referenced',
                code: `
                    function f() {}

                    function »«p() {
                        f;
                    }
                `,
                expectedOutgoingCalls: undefined,
            },
        ];

        it.each(testCases)('should list all outgoing calls ($testName)', async ({ code, expectedOutgoingCalls }) => {
            const result = await getActualSimpleOutgoingCalls(code);
            expect(result).toStrictEqual(expectedOutgoingCalls);
        });
    });
});

const getActualSimpleIncomingCalls = async (code: string): Promise<SimpleIncomingCall[] | undefined> => {
    const result = await callHierarchyProvider.incomingCalls({
        item: await getUniqueCallHierarchyItem(code),
    });

    return result?.map((call) => ({
        fromName: call.from.name,
        fromRangesLength: call.fromRanges.length,
    }));
};

const getActualSimpleOutgoingCalls = async (code: string): Promise<SimpleOutgoingCall[] | undefined> => {
    const result = await callHierarchyProvider.outgoingCalls({
        item: await getUniqueCallHierarchyItem(code),
    });

    return result?.map((call) => ({
        toName: call.to.name,
        fromRangesLength: call.fromRanges.length,
    }));
};

const getUniqueCallHierarchyItem = async (code: string): Promise<CallHierarchyItem> => {
    const document = await parse(code);

    const testRangesResult = findTestRanges(code, document.uri);
    if (testRangesResult.isErr) {
        throw new Error(testRangesResult.error.message);
    } else if (testRangesResult.value.length !== 1) {
        throw new Error(`Expected exactly one test range, but got ${testRangesResult.value.length}.`);
    }
    const testRangeStart = testRangesResult.value[0]!.start;

    const items =
        (await callHierarchyProvider.prepareCallHierarchy(document, {
            textDocument: {
                uri: document.textDocument.uri,
            },
            position: {
                line: testRangeStart.line,
                // Since the test range cannot be placed inside the identifier, we place it in front of the identifier.
                // Then we need to move the cursor one character to the right to be inside the identifier.
                character: testRangeStart.character + 1,
            },
        })) ?? [];

    if (items.length !== 1) {
        throw new Error(`Expected exactly one call hierarchy item, but got ${items.length}.`);
    }

    return items[0]!;
};

/**
 * A test case for {@link TTSLCallHierarchyProvider.incomingCalls}.
 */
interface IncomingCallTest {
    /**
     * A short description of the test case.
     */
    testName: string;

    /**
     * The code to parse.
     */
    code: string;

    /**
     * The expected incoming calls.
     */
    expectedIncomingCalls: SimpleIncomingCall[] | undefined;
}

/**
 * A simplified variant of {@link CallHierarchyIncomingCall}.
 */
interface SimpleIncomingCall {
    /**
     * The name of the caller.
     */
    fromName: string;

    /**
     * The number of calls in the caller.
     */
    fromRangesLength: number;
}

/**
 * A test case for {@link TTSLCallHierarchyProvider.outgoingCalls}.
 */
interface OutgoingCallTest {
    /**
     * A short description of the test case.
     */
    testName: string;

    /**
     * The code to parse.
     */
    code: string;

    /**
     * The expected outgoing calls.
     */
    expectedOutgoingCalls: SimpleOutgoingCall[] | undefined;
}

/**
 * A simplified variant of {@link CallHierarchyOutgoingCall}.
 */
interface SimpleOutgoingCall {
    /**
     * The name of the callee.
     */
    toName: string;

    /**
     * The number of calls in the callee.
     */
    fromRangesLength: number;
}
