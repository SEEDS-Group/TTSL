import { NodeFileSystem } from 'langium/node';
import { describe, expect, it } from 'vitest';
import { getLinkingErrors } from '../../helpers/diagnostics.js';
import { createTTSLServices } from '../../../src/language/index.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;

describe('TTSLWorkspaceManager', () => {
    describe('loadAdditionalDocuments', () => {
        it.each(['Any', 'Boolean', 'Float', 'Int', 'Nothing', 'Number', 'String'])(
            'should be possible to refer to %s',
            async (type) => {
                const diagnostics = await getLinkingErrors(
                    services,
                    `
package test

class C {
    attr a: ${type}
}
                `,
                );
                expect(diagnostics).toHaveLength(0);
            },
        );
    });
});
