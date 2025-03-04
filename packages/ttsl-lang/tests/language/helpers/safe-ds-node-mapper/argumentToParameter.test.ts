import { EmptyFileSystem } from 'langium';
import { describe, expect, it } from 'vitest';
import { isTslAbstractCall, TslArgument } from '../../../../src/language/generated/ast.js';
import { createTTSLServices, getArguments } from '../../../../src/language/index.js';
import { getNodeOfType } from '../../../helpers/nodeFinder.js';

const services = (await createTTSLServices(EmptyFileSystem, { omitBuiltins: true })).TTSL;
const nodeMapper = services.helpers.NodeMapper;

describe('TTSLNodeMapper', () => {
    describe('argumentToParameter', () => {
        it('should return undefined if passed undefined', () => {
            expect(nodeMapper.argumentToParameter(undefined)?.$type).toBeUndefined();
        });

        describe('named argument', () => {
            it('should return undefined if the parameter is unresolved', async () => {
                const code = `
                    function f(p: Int) {}

                    function myFunction () {
                        f(unresolved = 1);
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                const parameterNames = getArguments(call).map(parameterNameOrNull);
                expect(parameterNames).toStrictEqual([undefined]);
            });

            it('should return the resolved parameter', async () => {
                const code = `
                    function f(p1: Int, p2: Int, p3: Int) {}

                    function myFunction () {
                        f(p2 = 1, p3 = 1, p1 = 1);
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                const parameterNames = getArguments(call).map(parameterNameOrNull);
                expect(parameterNames).toStrictEqual(['p2', 'p3', 'p1']);
            });
        });

        describe('positional argument', () => {
            it('should return the parameter at the same index if all prior arguments are positional', async () => {
                const code = `
                    function f(p1: Int = 0, p2: Int, p3: Int) {}

                    function myFunction () {
                        f(1, 2, 3);
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                const parameterNames = getArguments(call).map(parameterNameOrNull);
                expect(parameterNames).toStrictEqual(['p1', 'p2', 'p3']);
            });

            it('should return undefined if a prior argument is named', async () => {
                const code = `
                    function f(p1: Int = 0, p2: Int, p3: Int) {}

                    function myFunction () {
                        f(p2 = 1, 2, 3);
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                const parameterNames = getArguments(call).map(parameterNameOrNull);
                expect(parameterNames).toStrictEqual(['p2', undefined, undefined]);
            });

            it('should return undefined if argument is out of bounds', async () => {
                const code = `
                    function f(p1: Int, p2: Int) {}

                    function myFunction () {
                        f(1, 2, 3);
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                const parameterNames = getArguments(call).map(parameterNameOrNull);
                expect(parameterNames).toStrictEqual(['p1', 'p2', undefined]);
            });
        });

        const parameterNameOrNull = (node: TslArgument): string | undefined => {
            const parameter = nodeMapper.argumentToParameter(node);
            return parameter?.name ?? undefined;
        };
    });
});
