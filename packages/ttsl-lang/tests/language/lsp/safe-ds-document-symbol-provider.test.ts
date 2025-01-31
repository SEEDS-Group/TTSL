import { NodeFileSystem } from 'langium/node';
import { parseDocument, textDocumentParams } from 'langium/test';
import { describe, expect, it } from 'vitest';
import { DocumentSymbol, SymbolKind, SymbolTag } from 'vscode-languageserver';
import { createTTSLServices } from '../../../src/language/index.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const symbolProvider = services.lsp.DocumentSymbolProvider!;

describe('TTSLSemanticTokenProvider', async () => {
    const testCases: DocumentSymbolProviderTest[] = [
        {
            testName: 'function declaration',
            code: 'function F(p: Int): Int {}',
            expectedSymbols: [
                {
                    name: 'F',
                    detail: 'Int',
                    kind: SymbolKind.Function,
                },
            ],
        },
        {
            testName: 'constant declaration',
            code: 'constant c: Int = 0',
            expectedSymbols: [
                {
                    name: 'c',
                    kind: SymbolKind.Constant,
                },
            ],
        },
        {
            testName: 'data declaration',
            code: `
                data d: Int
            `,
            expectedSymbols: [
                {
                    name: 'd',
                    kind: SymbolKind.Property,
                },
            ],
        },
        {
            testName: 'module',
            code: 'package a.b.c',
            expectedSymbols: [
                {
                    name: 'a.b.c',
                    kind: SymbolKind.Package,
                },
            ],
        },
    ];

    it.each(testCases)('should assign the correct symbols ($testName)', async ({ code, expectedSymbols }) => {
        await checkDocumentSymbols(code, expectedSymbols);
    });
});

const checkDocumentSymbols = async (code: string, expectedSymbols: SimpleDocumentSymbol[]) => {
    const document = await parseDocument(services, code);
    const symbols = (await symbolProvider.getSymbols(document, textDocumentParams(document))) ?? [];
    const simpleSymbols = symbols.map(simplifyDocumentSymbol);

    expect(simpleSymbols).toStrictEqual(expectedSymbols);
};

const simplifyDocumentSymbol = (symbol: DocumentSymbol): SimpleDocumentSymbol => {
    const result = {
        name: symbol.name,
        kind: symbol.kind,
        tags: symbol.tags,
        detail: symbol.detail,
        children: symbol.children?.map(simplifyDocumentSymbol),
    };

    if (!result.tags) {
        delete result.tags;
    }
    if (!result.detail) {
        delete result.detail;
    }
    if (!result.children) {
        delete result.children;
    }

    return result;
};

/**
 * A description of a test case for the document symbol provider.
 */
interface DocumentSymbolProviderTest {
    /**
     * A short description of the test case.
     */
    testName: string;

    /**
     * The code to parse.
     */
    code: string;

    /**
     * The expected symbols.
     */
    expectedSymbols: SimpleDocumentSymbol[];
}

/**
 * A document symbol without range information.
 */
interface SimpleDocumentSymbol {
    name: string;
    kind: SymbolKind;
    tags?: SymbolTag[];
    detail?: string;
    children?: SimpleDocumentSymbol[];
}
