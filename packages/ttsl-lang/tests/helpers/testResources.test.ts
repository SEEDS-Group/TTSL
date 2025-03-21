import { describe, expect, it } from 'vitest';
import {
    listTestFilesWithExtensions,
    listTestTTSLFiles,
    listTestTTSLFilesGroupedByParentDirectory,
    ShortenedTestResourceName,
    TestResourceName,
    testResourceNameToUri,
    uriToShortenedTestResourceName,
} from './testResources.js';
import { URI } from 'langium';

describe('uriToShortenedTestResourceName', () => {
    it('should return the corresponding resource name if no root resource name is given', () => {
        const resourceName = 'helpers/listTTSLFiles';
        const actual = uriToShortenedTestResourceName(testResourceNameToUri(resourceName));
        expect(normalizeResourceName(actual)).toBe(normalizeResourceName(resourceName));
    });

    it('should return a shortened resource name if a root resource name is given', () => {
        const resourceName = 'helpers/nested/listTTSLFiles';
        const actual = uriToShortenedTestResourceName(testResourceNameToUri(resourceName), 'helpers/nested');
        expect(actual).toBe('listTTSLFiles');
    });
});

describe('listTestTTSLFiles', () => {
    it('should return all TTSL files in a resource directory that are not skipped', () => {
        const rootResourceName = 'helpers/listTTSLFiles';
        const actual = listTestTTSLFiles(rootResourceName);
        const expected = ['function file.ttsl', 'nested/function file.ttsl'];

        expectFileListsToMatch(rootResourceName, actual, expected);
    });
});

describe('listTestFilesWithExtensions', () => {
    it('should return all Python files in a resource directory', () => {
        const rootResourceName = 'helpers/listPythonFiles';
        const actual = listTestFilesWithExtensions(rootResourceName, ['py']);
        const expected = ['python file.py', 'nested/python file.py'];

        expectFileListsToMatch(rootResourceName, actual, expected);
    });
});

describe('listTestTTSLFilesGroupedByParentDirectory', () => {
    it('should return all TTSL files in a directory that are not skipped and group them by parent directory', () => {
        const rootResourceName = 'helpers/listTTSLFiles';
        const result = new Map(listTestTTSLFilesGroupedByParentDirectory(rootResourceName));

        // Compare the keys, i.e. the parent directories
        const actualKeys = [...result.keys()];
        const expectedKeys = ['', 'nested'];
        expectFileListsToMatch(rootResourceName, actualKeys, expectedKeys);

        // Compare the values, i.e. the files, in the root directory
        const actualValuesDirectlyInRoot = [...result.entries()].find(
            ([key]) => uriToShortenedTestResourceName(key, rootResourceName) === '',
        )!;
        const expectedValuesDirectlyInRoot = ['function file.ttsl'];
        expectFileListsToMatch(rootResourceName, actualValuesDirectlyInRoot[1], expectedValuesDirectlyInRoot);

        // Compare the values, i.e. the files, in the nested directory
        const actualValuesInNested = [...result.entries()].find(
            ([key]) => uriToShortenedTestResourceName(key, rootResourceName) === 'nested',
        )!;
        const expectedValuesInNested = ['nested/function file.ttsl'];
        expectFileListsToMatch(rootResourceName, actualValuesInNested[1], expectedValuesInNested);
    });
});

/**
 * Asserts that the actual uris and the expected shortened resource names point to the same files.
 *
 * @param rootResourceName The root resource name.
 * @param actualUris The actual URIs computed by some function under test.
 * @param expectedShortenedResourceNames The expected shortened resource names.
 */
const expectFileListsToMatch = (
    rootResourceName: TestResourceName,
    actualUris: URI[],
    expectedShortenedResourceNames: ShortenedTestResourceName[],
): void => {
    const actualShortenedResourceNames = actualUris.map((uri) => uriToShortenedTestResourceName(uri, rootResourceName));
    expect(normalizeResourceNames(actualShortenedResourceNames)).toStrictEqual(
        normalizeResourceNames(expectedShortenedResourceNames),
    );
};

/**
 * Normalizes the given resource names by replacing backslashes with slashes and sorting them.
 *
 * @param resourceNames The resource names to normalize.
 * @return The normalized resource names.
 */
const normalizeResourceNames = (resourceNames: string[]): string[] => {
    return resourceNames.map(normalizeResourceName).sort();
};

/**
 * Normalizes the given resource name by replacing backslashes with slashes.
 *
 * @param resourceName The resource name to normalize.
 * @return The normalized resource name.
 */
const normalizeResourceName = (resourceName: string): string => {
    return resourceName.replace(/\\/gu, '/');
};
