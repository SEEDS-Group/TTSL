import { describe, expect, it } from 'vitest';
import { Result } from 'true-myth';
import { processPaths } from '../../src/helpers/documents.js';
import { createSafeDsServices } from '@ttsl/lang';
import { NodeFileSystem } from 'langium/node';
import { fileURLToPath } from 'url';
import path from 'node:path';
import { ExitCode } from '../../src/cli/exitCode.js';

describe('processPaths', async () => {
    const services = (await createSafeDsServices(NodeFileSystem)).SafeDs;
    const testResourcesRoot = new URL('../resources/processPaths/', import.meta.url);

    const tests: ProcessPathsTest[] = [
        {
            testName: 'pipe file',
            paths: ['a.Tslpipe'],
            expected: Result.ok(['a.Tslpipe']),
        },
        {
            testName: 'stub file',
            paths: ['b.Tslstub'],
            expected: Result.ok(['b.Tslstub']),
        },
        {
            testName: 'test file',
            paths: ['c.Tsltest'],
            expected: Result.ok(['c.Tsltest']),
        },
        {
            testName: 'multiple files',
            paths: ['a.Tslpipe', 'b.Tslstub', 'c.Tsltest'],
            expected: Result.ok(['a.Tslpipe', 'b.Tslstub', 'c.Tsltest']),
        },
        {
            testName: 'duplicates',
            paths: ['a.Tslpipe', 'a.Tslpipe'],
            expected: Result.ok(['a.Tslpipe']),
        },
        {
            testName: 'directory',
            paths: ['.'],
            expected: Result.ok([
                'a.Tslpipe',
                'b.Tslstub',
                'c.Tsltest',
                'nested/a.Tslpipe',
                'nested/b.Tslstub',
                'nested/c.Tsltest',
            ]),
        },
        {
            testName: 'missing file',
            paths: ['missing.txt'],
            expected: Result.err(ExitCode.MissingPath),
        },
        {
            testName: 'not a Safe-DS file',
            paths: ['d.txt'],
            expected: Result.err(ExitCode.FileWithoutSafeDsExtension),
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
