import { EmptyFileSystem } from 'langium';
import { clearDocuments, parseHelper } from 'langium/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTTSLServices } from '../../../src/language/index.js';

const services = (await createTTSLServices(EmptyFileSystem, { omitBuiltins: true })).TTSL;
const packageManager = services.workspace.PackageManager;

const document1 = `
package myPackage1

class Class1

class Class2
`;

const document2 = `
package myPackage1

enum Enum1
`;

const document3 = `
package myPackage1.subPackage1

class Class3

enum Enum2

internal segment segment1() {}
`;

const document4 = `
package myPackage2

class Class4
`;

describe.skip('TTSLPackageManager', () => {
    beforeAll(async () => {
        await parseHelper(services)(document1);
        await parseHelper(services)(document2);
        await parseHelper(services)(document3);
        await parseHelper(services)(document4);
    });

    afterAll(async () => {
        await clearDocuments(services);
    });

    describe('getPackageNames', () => {
        it('should return the package names sorted alphabetically', () => {
            expect(packageManager.getPackageNames()).toStrictEqual([
                'myPackage1',
                'myPackage1.subPackage1',
                'myPackage2',
            ]);
        });
    });

    describe('hasPackage', () => {
        it('should return true for existing packages', () => {
            expect(packageManager.hasPackage('myPackage1')).toBeTruthy();
        });

        it('should return false for non-existing packages', () => {
            expect(packageManager.hasPackage('myPackage3')).toBeFalsy();
        });
    });

    describe('getDeclarationsInPackage', () => {
        it('should return all declarations in the given package', () => {
            const result = packageManager.getDeclarationsInPackage('myPackage1');

            expect(result.map((desc) => desc.name)).toStrictEqual(['Class1', 'Class2', 'Enum1']);
        });

        it('should filter by node type if specified', () => {
            const result = packageManager.getDeclarationsInPackage('myPackage1', { nodeType: 'TslEnum' });

            expect(result.map((desc) => desc.name)).toStrictEqual(['Enum1']);
        });

        it('should hide internal declarations if requested', () => {
            const result = packageManager.getDeclarationsInPackage('myPackage1', { hideInternal: true });

            expect(result.map((desc) => desc.name)).toStrictEqual(['Class1', 'Class2', 'Enum1']);
        });
    });

    describe('getDeclarationsInPackageOrSubpackage', () => {
        it('should return all declarations in the given package or any (transitive) subpackage', () => {
            const result = packageManager.getDeclarationsInPackageOrSubpackage('myPackage1');

            expect(result.map((desc) => desc.name)).toStrictEqual([
                'Class1',
                'Class2',
                'Enum1',
                'Class3',
                'Enum2',
                'segment1',
            ]);
        });

        it('should filter by node type if specified', () => {
            const result = packageManager.getDeclarationsInPackageOrSubpackage('myPackage1', { nodeType: 'TslEnum' });

            expect(result.map((desc) => desc.name)).toStrictEqual(['Enum1', 'Enum2']);
        });

        it('should hide internal declarations if requested', () => {
            const result = packageManager.getDeclarationsInPackageOrSubpackage('myPackage1', { hideInternal: true });

            expect(result.map((desc) => desc.name)).toStrictEqual(['Class1', 'Class2', 'Enum1', 'Class3', 'Enum2']);
        });
    });
});
