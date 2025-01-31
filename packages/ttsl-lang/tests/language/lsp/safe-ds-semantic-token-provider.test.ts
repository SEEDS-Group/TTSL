import { AssertionError } from 'assert';
import { NodeFileSystem } from 'langium/node';
import { highlightHelper } from 'langium/test';
import { describe, it } from 'vitest';
import { SemanticTokenTypes } from 'vscode-languageserver';
import { createTTSLServices } from '../../../src/language/index.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;

describe('TTSLSemanticTokenProvider', async () => {
    it.each([
        {
            testName: 'argument',
            code: `
                function f(p: String){}

                function p() {
                    f(<|p|> = "foo")
                }
            `,
            expectedTokenTypes: [SemanticTokenTypes.parameter],
        },
        {
            testName: 'function declaration',
            code: `
                function <|f|>() {}
            `,
            expectedTokenTypes: [SemanticTokenTypes.function],
        },
        {
            testName: 'module',
            code: 'package <|a.b.c|>',
            expectedTokenTypes: [SemanticTokenTypes.namespace],
        },
        {
            testName: 'parameter declaration',
            code: 'function f(<|p|>: String)',
            expectedTokenTypes: [SemanticTokenTypes.parameter],
        },
        {
            testName: 'placeholder declaration',
            code: `
                function f() {
                    var <|a|>: Int = 1;
                }
            `,
            expectedTokenTypes: [SemanticTokenTypes.variable],
        } /* 
        {
            testName: 'result declaration',
            code: 'fun f() -> (<|r|>: String)',
            expectedTokenTypes: [SemanticTokenTypes.parameter],
        }, 
        {
            testName: 'type alias declaration',
            code: 'typealias <|T|> = List<Int>',
            expectedTokenTypes: [SemanticTokenTypes.typealias],
        },*/,
        {
            testName: 'import',
            code: 'from <|a.b.c|> import X',
            expectedTokenTypes: [SemanticTokenTypes.namespace],
        } /* 
        {
            testName: 'imported declaration',
            code: 'from TTSL.lang import <|Any|>',
            expectedTokenTypes: [SemanticTokenTypes.function],
        }, */,
        {
            testName: 'reference',
            code: `
                function f(p: String){}

                function p() {
                    <|f|>;
                }
            `,
            expectedTokenTypes: [SemanticTokenTypes.function],
        },
    ])('should assign the correct token types ($testName)', async ({ code, expectedTokenTypes }) => {
        await checkSemanticTokens(code, expectedTokenTypes);
    });
});

const checkSemanticTokens = async (code: string, expectedTokenTypes: SemanticTokenTypes[]) => {
    const actualTokensWithRanges = await highlightHelper(services)(code);
    expectedTokenTypes.forEach((expectedTokenType, index) => {
        const range = actualTokensWithRanges.ranges[index];
        if (!range) {
            throw new AssertionError({
                message: `No range found for token at index ${index}.`,
            });
        }

        const tokensAtRange = actualTokensWithRanges.tokens.filter(
            (token) => token.offset === range[0] && token.offset + token.text.length === range[1],
        );

        if (tokensAtRange.length !== 1) {
            throw new AssertionError({
                message: `Expected exactly one token at offset range ${range}, but found ${tokensAtRange.length}.`,
            });
        }

        const tokenAtRange = tokensAtRange[0]!;
        if (tokenAtRange.tokenType !== expectedTokenType) {
            throw new AssertionError({
                message: `Expected token at offset range ${range} to be of type ${expectedTokenType}, but was ${tokenAtRange.tokenType}.`,
                actual: tokenAtRange.tokenType,
                expected: expectedTokenType,
            });
        }
    });
};
