import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ExitCode } from '../../src/cli/exitCode.js';

const projectRoot = new URL('../..', import.meta.url);

describe('ttsl', () => {
    beforeAll(() => {
        execSync('npm run build:clean', { cwd: projectRoot });
    });

    describe('root', () => {
        const spawnRootProcess = (additionalArguments: string[]) => {
            return spawnSync('node', ['./bin/cli', ...additionalArguments], { cwd: projectRoot });
        };

        it('should show usage on stderr if no arguments are passed', () => {
            const process = spawnRootProcess([]);
            expect(process.stderr.toString()).toContain('Usage: cli [options] [command]');
            expect(process.status).not.toBe(ExitCode.Success);
        });

        it('should show usage on stdout if -h flag is passed', () => {
            const process = spawnRootProcess(['-h']);
            expect(process.stdout.toString()).toContain('Usage: cli [options] [command]');
            expect(process.status).toBe(ExitCode.Success);
        });

        it('should show version if -V flag is passed', () => {
            const process = spawnRootProcess(['-V']);
            expect(process.stdout.toString()).toMatch(/\d+\.\d+\.\d+/u);
            expect(process.status).toBe(ExitCode.Success);
        });
    });

    describe('check', () => {
        const testResourcesRoot = new URL('../resources/check/', import.meta.url);
        const spawnCheckProcess = (additionalArguments: string[], paths: string[]) => {
            const fsPaths = paths.map((p) => fileURLToPath(new URL(p, testResourcesRoot)));
            return spawnSync('node', ['./bin/cli', 'check', ...additionalArguments, ...fsPaths], {
                cwd: projectRoot,
            });
        };

        it('should show an error if no paths are passed', () => {
            const process = spawnCheckProcess([], []);
            expect(process.stderr.toString()).toContain("error: missing required argument 'paths'");
            expect(process.status).not.toBe(ExitCode.Success);
        });

        it('should show usage on stdout if -h flag is passed', () => {
            const process = spawnCheckProcess(['-h'], []);
            expect(process.stdout.toString()).toContain('Usage: cli check');
            expect(process.status).toBe(ExitCode.Success);
        });

        it('should show errors in wrong files', () => {
            const process = spawnCheckProcess([], ['.']);
            expect(process.stderr.toString()).toMatch(/Found \d+ errors?\./u);
            expect(process.status).toBe(ExitCode.FileHasErrors);
        });

        it('should show not show errors in correct files', () => {
            const process = spawnCheckProcess([], ['correct.ttsl']);
            expect(process.stdout.toString()).toContain('No errors found.');
            expect(process.status).toBe(ExitCode.Success);
        });

        it('should handle references to builtins', () => {
            const process = spawnCheckProcess([], ['references builtins.ttsl']);
            expect(process.stdout.toString()).toContain('No errors found.');
            expect(process.status).toBe(ExitCode.Success);
        });

        it('should treat warnings as errors in strict mode', () => {
            const process = spawnCheckProcess(['-s'], ['contains warnings.ttsl']);
            expect(process.stderr.toString()).toMatch(/Found \d+ errors?\./u);
            expect(process.status).toBe(ExitCode.FileHasErrors);
        });

        it('should show an error if the file does not exist', () => {
            const process = spawnCheckProcess([], ['missing.ttsl']);
            expect(process.stderr.toString()).toMatch(/Path .* does not exist\./u);
            expect(process.status).toBe(ExitCode.MissingPath);
        });

        it('should show an error if a file has the wrong extension', () => {
            const process = spawnCheckProcess([], ['not ttsl.txt']);
            expect(process.stderr.toString()).toContain('does not have a TTSL extension');
            expect(process.status).toBe(ExitCode.FileWithoutTTSLExtension);
        });
    });

    describe('format', () => {
        const testResourcesRoot = new URL('../resources/format/', import.meta.url);
        const spawnFormatProcess = (additionalArguments: string[], paths: string[]) => {
            const fsPaths = paths.map((p) => fileURLToPath(new URL(p, testResourcesRoot)));
            return spawnSync('node', ['./bin/cli', 'format', ...additionalArguments, ...fsPaths], {
                cwd: projectRoot,
            });
        };

        it('should show an error if no paths are passed', () => {
            const process = spawnFormatProcess([], []);
            expect(process.stderr.toString()).toContain("error: missing required argument 'paths'");
            expect(process.status).not.toBe(ExitCode.Success);
        });

        it('should show usage on stdout if -h flag is passed', () => {
            const process = spawnFormatProcess(['-h'], []);
            expect(process.stdout.toString()).toContain('Usage: cli format');
            expect(process.status).toBe(ExitCode.Success);
        });

        it('should show errors in wrong files', () => {
            const process = spawnFormatProcess([], ['.']);
            expect(process.stderr.toString()).toContain('has syntax errors');
            expect(process.status).toBe(ExitCode.FileHasErrors);
        });

        it('should show not show errors in correct files', () => {
            const process = spawnFormatProcess([], ['correct.ttsl']);
            expect(process.stdout.toString()).toContain('TTSL code formatted successfully.');
            expect(process.status).toBe(ExitCode.Success);
        });

        it('should show an error if the file does not exist', () => {
            const process = spawnFormatProcess([], ['missing.ttsl']);
            expect(process.stderr.toString()).toMatch(/Path .* does not exist\./u);
            expect(process.status).toBe(ExitCode.MissingPath);
        });

        it('should show an error if a file has the wrong extension', () => {
            const process = spawnFormatProcess([], ['not ttsl.txt']);
            expect(process.stderr.toString()).toContain('does not have a TTSL extension');
            expect(process.status).toBe(ExitCode.FileWithoutTTSLExtension);
        });
    });

    describe('generate', () => {
        const testResourcesRoot = new URL('../resources/generate/', import.meta.url);
        const spawnGenerateProcess = (additionalArguments: string[], paths: string[]) => {
            const fsPaths = paths.map((p) => fileURLToPath(new URL(p, testResourcesRoot)));
            return spawnSync('node', ['./bin/cli', 'generate', ...additionalArguments, ...fsPaths], {
                cwd: projectRoot,
            });
        };

        afterAll(() => {
            fs.rmSync(new URL('generated', testResourcesRoot), { recursive: true, force: true });
        });

        it('should show an error if no paths are passed', () => {
            const process = spawnGenerateProcess([], []);
            expect(process.stderr.toString()).toContain("error: missing required argument 'paths'");
            expect(process.status).not.toBe(ExitCode.Success);
        });

        it('should show usage on stdout if -h flag is passed', () => {
            const process = spawnGenerateProcess(['-h'], []);
            expect(process.stdout.toString()).toContain('Usage: cli generate');
            expect(process.status).toBe(ExitCode.Success);
        });

        it('should generate Python code', () => {
            const process = spawnGenerateProcess([], ['correct.ttsl']);
            expect(process.stdout.toString()).toContain('Python code generated successfully.');
            expect(process.status).toBe(ExitCode.Success);
        });

        it('should generate Python code (TTSL code references builtins)', () => {
            const process = spawnGenerateProcess([], ['references builtins.ttsl']);
            expect(process.stdout.toString()).toContain('Python code generated successfully.');
            expect(process.status).toBe(ExitCode.Success);
        });

        it('should show an error if the file does not exist', () => {
            const process = spawnGenerateProcess([], ['missing.ttsl']);
            expect(process.stderr.toString()).toMatch(/Path .* does not exist./u);
            expect(process.status).toBe(ExitCode.MissingPath);
        });

        it('should show an error if the file has the wrong extension', () => {
            const process = spawnGenerateProcess([], ['not ttsl.txt']);
            expect(process.stderr.toString()).toContain('does not have a TTSL extension');
            expect(process.status).toBe(ExitCode.FileWithoutTTSLExtension);
        });

        it('should show an error if a TTSL file has errors', () => {
            const process = spawnGenerateProcess([], ['.']);
            expect(process.stderr.toString()).toContain(
                "Could not resolve reference to TslNamedTypeDeclaration named 'Unresolved'",
            );
            expect(process.status).toBe(ExitCode.FileHasErrors);
        });
    });
});
