import { afterEach, describe, expect, it } from 'vitest';
import { getNodeByLocation, getNodeOfType } from './nodeFinder.js';
import { createTTSLServices } from '../../src/language/index.js';
import { EmptyFileSystem } from 'langium';
import { AssertionError } from 'assert';
import { clearDocuments, parseHelper } from 'langium/test';
import { isTslConstant, isTslDeclaration, isTslFunction } from '../../src/language/generated/ast.js';

describe('getNodeByLocation', async () => {
    const services = (await createTTSLServices(EmptyFileSystem, { omitBuiltins: true })).TTSL;

    afterEach(async () => {
        await clearDocuments(services);
    });

    it('should throw if no document is found', () => {
        expect(() => {
            getNodeByLocation(services, {
                uri: 'file:///test.ttsl',
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
            });
        }).toThrowErrorMatchingSnapshot();
    });

    it('should throw if no node is found', async () => {
        const document = await parseHelper(services)(`function F() {}`);

        expect(() => {
            getNodeByLocation(services, {
                uri: document.uri.toString(),
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
            });
        }).toThrow(AssertionError);
    });

    it('should return the node that fills the range completely', async () => {
        const document = await parseHelper(services)(`function F() {}`);

        expect(
            getNodeByLocation(services, {
                uri: document.uri.toString(),
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 15 } },
            }),
        ).to.satisfy(isTslFunction);
    });

    it('should return the node whose name fills the range completely', async () => {
        const document = await parseHelper(services)(`function F() {}`);

        expect(
            getNodeByLocation(services, {
                uri: document.uri.toString(),
                range: { start: { line: 0, character: 6 }, end: { line: 0, character: 15 } },
            }),
        ).to.satisfy(isTslFunction);
    });
});

describe('getNodeOfType', async () => {
    const services = (await createTTSLServices(EmptyFileSystem, { omitBuiltins: true })).TTSL;

    afterEach(async () => {
        await clearDocuments(services);
    });

    it('should throw if no node is found', async () => {
        const code = '';
        expect(async () => {
            await getNodeOfType(services, code, isTslFunction);
        }).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should throw if not enough nodes are found', async () => {
        const code = `function F() {}`;
        expect(async () => {
            await getNodeOfType(services, code, isTslFunction, 1);
        }).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should return the first matching node if no index is set', async () => {
        const code = 'function F() {}';
        const node = await getNodeOfType(services, code, isTslFunction);
        expect(node).to.satisfy(isTslFunction);
    });

    it('should return the nth matching node if an index is set', async () => {
        const code = `
            package p

            function F() {}
            constant C: Int = 0;
        `;
        const node = await getNodeOfType(services, code, isTslDeclaration, 2);
        expect(node).to.satisfy(isTslConstant);
    });
});
