import { EmptyFileSystem } from 'langium';
import { describe, expect, it } from 'vitest';
import { isTslPlaceholder } from '../../../../src/language/generated/ast.js';
import { createTTSLServices } from '../../../../src/language/index.js';
import { getNodeOfType } from '../../../helpers/nodeFinder.js';

const services = (await createTTSLServices(EmptyFileSystem, { omitBuiltins: true })).TTSL;
const nodeMapper = services.helpers.NodeMapper;

describe('TTSLNodeMapper', () => {
    describe('placeholderToReferences', () => {
        it('should return an empty list if passed undefined', async () => {
            expect(nodeMapper.placeholderToReferences(undefined).toArray()).toStrictEqual([]);
        });
        /*
        it('should return references in default values', async () => {
            const code = `
                function myFunction() {
                    var a1 = 1;
                    function f(p1: Int = a1){}
                }
            `;

            const placeholder = await getNodeOfType(services, code, isTslPlaceholder);
            expect(nodeMapper.placeholderToReferences(placeholder).toArray()).toHaveLength(1);
        });
        */
        it('should return references directly in body', async () => {
            const code = `
                function myFunction () {
                    var a1 = 1;

                    a1;
                    a1;
                };
            `;

            const placeholder = await getNodeOfType(services, code, isTslPlaceholder);
            expect(nodeMapper.placeholderToReferences(placeholder).toArray()).toHaveLength(2);
        });

        it('should not return references to other placeholders', async () => {
            const code = `
                function myFunction () {
                    var a1 = 1;
                    var a2 = 2;

                    a1;
                    a2;
                };
            `;

            const placeholder = await getNodeOfType(services, code, isTslPlaceholder);
            expect(nodeMapper.placeholderToReferences(placeholder).toArray()).toHaveLength(1);
        });
    });
});
