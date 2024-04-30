import { afterEach, describe, expect, it } from 'vitest';
import { getNodeByLocation, getNodeOfType } from './nodeFinder.js';
import { createSafeDsServices } from '../../src/language/index.js';
import { EmptyFileSystem } from 'langium';
import { AssertionError } from 'assert';
import { clearDocuments, parseHelper } from 'langium/test';
import { isTslClass, isTslDeclaration, isTslEnum } from '../../src/language/generated/ast.js';

describe('getNodeByLocation', async () => {
    const services = (await createSafeDsServices(EmptyFileSystem, { omitBuiltins: true })).SafeDs;

    afterEach(async () => {
        await clearDocuments(services);
    });

    it('should throw if no document is found', () => {
        expect(() => {
            getNodeByLocation(services, {
                uri: 'file:///test.Tsltest',
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
            });
        }).toThrowErrorMatchingSnapshot();
    });

    it('should throw if no node is found', async () => {
        const document = await parseHelper(services)(`class C`);

        expect(() => {
            getNodeByLocation(services, {
                uri: document.uri.toString(),
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
            });
        }).toThrow(AssertionError);
    });

    it('should return the node that fills the range completely', async () => {
        const document = await parseHelper(services)(`class C`);

        expect(
            getNodeByLocation(services, {
                uri: document.uri.toString(),
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 7 } },
            }),
        ).to.satisfy(isTslClass);
    });

    it('should return the node whose name fills the range completely', async () => {
        const document = await parseHelper(services)(`class C`);

        expect(
            getNodeByLocation(services, {
                uri: document.uri.toString(),
                range: { start: { line: 0, character: 6 }, end: { line: 0, character: 7 } },
            }),
        ).to.satisfy(isTslClass);
    });
});

describe('getNodeOfType', async () => {
    const services = (await createSafeDsServices(EmptyFileSystem, { omitBuiltins: true })).SafeDs;

    afterEach(async () => {
        await clearDocuments(services);
    });

    it('should throw if no node is found', async () => {
        const code = '';
        expect(async () => {
            await getNodeOfType(services, code, isTslClass);
        }).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should throw if not enough nodes are found', async () => {
        const code = `class C`;
        expect(async () => {
            await getNodeOfType(services, code, isTslClass, 1);
        }).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should return the first matching node if no index is set', async () => {
        const code = 'class C';
        const node = await getNodeOfType(services, code, isTslClass);
        expect(node).to.satisfy(isTslClass);
    });

    it('should return the nth matching node if an index is set', async () => {
        const code = `
            package p

            class C
            enum D
        `;
        const node = await getNodeOfType(services, code, isTslDeclaration, 2);
        expect(node).to.satisfy(isTslEnum);
    });
});
