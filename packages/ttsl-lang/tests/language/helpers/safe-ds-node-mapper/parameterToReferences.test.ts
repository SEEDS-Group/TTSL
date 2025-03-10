import { EmptyFileSystem } from 'langium';
import { describe, expect, it } from 'vitest';
import { isTslParameter } from '../../../../src/language/generated/ast.js';
import { createTTSLServices } from '../../../../src/language/index.js';
import { getNodeOfType } from '../../../helpers/nodeFinder.js';

const services = (await createTTSLServices(EmptyFileSystem, { omitBuiltins: true })).TTSL;
const nodeMapper = services.helpers.NodeMapper;

describe('TTSLNodeMapper', () => {
    describe('parameterToReferences', () => {
        it('should return an empty list if passed undefined', async () => {
            expect(nodeMapper.parameterToReferences(undefined).toArray()).toStrictEqual([]);
        });

        it('should return references in default values', async () => {
            const code = `
                function myFunction(p1: Int, p2: Int = p1) {}
            `;

            const parameter = await getNodeOfType(services, code, isTslParameter);
            expect(nodeMapper.parameterToReferences(parameter).toArray()).toHaveLength(1);
        });

        it('should return references directly in body', async () => {
            const code = `
                function myFunction(p1: Int) {
                    p1;
                    p1;
                };
            `;

            const parameter = await getNodeOfType(services, code, isTslParameter);
            expect(nodeMapper.parameterToReferences(parameter).toArray()).toHaveLength(2);
        });

        it('should return references in own parameter list', async () => {
            const code = `
                function myFunction(p1: Int, p2: Int = p1) {};
            `;

            const parameter = await getNodeOfType(services, code, isTslParameter);
            expect(nodeMapper.parameterToReferences(parameter).toArray()).toHaveLength(1);
        });

        it('should not return references to other parameters', async () => {
            const code = `
                function myFunction(p1: Int, p2: Int) {
                    p1;
                    p2;
                };
            `;

            const parameter = await getNodeOfType(services, code, isTslParameter);
            expect(nodeMapper.parameterToReferences(parameter).toArray()).toHaveLength(1);
        });
    });
});
