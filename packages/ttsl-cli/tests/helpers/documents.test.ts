import { describe, expect, it } from 'vitest';
import { Result } from 'true-myth';
import { processPaths } from '../../src/helpers/documents.js';
import { createTTSLServices } from '@ttsl/lang';
import { NodeFileSystem } from 'langium/node';
import { fileURLToPath } from 'url';
import path from 'node:path';
import { ExitCode } from '../../src/cli/exitCode.js';

describe('processPaths', async () => {
    const services = (await createTTSLServices(NodeFileSystem)).TTSL;
    const testResourcesRoot = new URL('../resources/processPaths/', import.meta.url);

    const tests: ProcessPathsTest[] = [
        {
            testName: 'test file',
            paths: ['a.ttsl'],
            expected: Result.ok(['a.ttsl']),
        },
        {
            testName: 'multiple files',
            paths: ['a.ttsl', 'b.ttsl'],
            expected: Result.ok(['a.ttsl', 'b.ttsl']),
        },
        {
            testName: 'duplicates',
            paths: ['a.ttsl', 'a.ttsl'],
            expected: Result.ok(['a.ttsl']),
        } /*
        {
            testName: 'directory',
            paths: [''],
            expected: Result.ok([
                'a.ttsl',
                'b.ttsl',
                'nested/a.ttsl',
                'nested/b.ttsl',
            ]),
        },*/,
        {
            testName: 'missing file',
            paths: ['missing.txt'],
            expected: Result.err(ExitCode.MissingPath),
        },
        {
            testName: 'not a TTSL file',
            paths: ['c.txt'],
            expected: Result.err(ExitCode.FileWithoutTTSLExtension),
        },
    ];

    it.each(tests)('$testName', ({ paths, expected }) => {
        const absolutePaths = paths.map((p) => fileURLToPath(new URL(p, testResourcesRoot)));
        const actual = processPaths(services, absolutePaths);

        if (expected.isErr) {
            expect(actual.isErr).toBeTruthy();
            if (actual.isErr) {
                expect(actual.error.code).toBe(expected.error);
            }
        } else {
            expect(actual.isOk).toBeTruthy();
            if (actual.isOk) {
                const relativePaths = actual.value.map((uri) =>
                    path.relative(fileURLToPath(testResourcesRoot), uri.fsPath).replaceAll('\\', '/'),
                );
                expect(relativePaths).toStrictEqual(expected.value);
            }
        }
    });
});

/**
 * A test case for the `processPaths` function.
 */
interface ProcessPathsTest {
    /**
     * A human-readable name for the test case.
     */
    testName: string;

    /**
     * The paths to process.
     */
    paths: string[];

    /**
     * The expected result.
     */
    expected: Result<string[], number>;
}
