import { describe, expect, it } from 'vitest';
import { isTslAbstractCall } from '../../../../src/language/generated/ast.js';
import { getNodeOfType } from '../../../helpers/nodeFinder.js';
import { NodeFileSystem } from 'langium/node';
import { createTTSLServices } from '../../../../src/language/index.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const nodeMapper = services.helpers.NodeMapper;

describe('TTSLNodeMapper', () => {
    describe('callToCallable', () => {
        it('should return undefined if passed undefined', () => {
            expect(nodeMapper.callToCallable(undefined)).toBeUndefined();
        });

        // -----------------------------------------------------------------------------------------
        // Calls
        // -----------------------------------------------------------------------------------------

        describe('calls', () => {
            it('should return undefined if receiver is unresolved', async () => {
                const code = `
                    function myFunction () {
                        unresolved();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBeUndefined();
            });

            it('should return undefined if receiver is not callable', async () => {
                const code = `
                    constant c: Int = 0

                    function myFunction () {
                        c();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBeUndefined();
            });

            it('should return the called function', async () => {
                const code = `
                    function f()

                    function myFunction () {
                        f();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslFunction');
            });

            it('should ignore nullability (method, null-safe call)', async () => {
                const code = `
                    function f {}

                    function myFunction(
                        fOrNull: f?
                    ) {
                        fOrNull?();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslFunction');
            });
        });
    });
});
