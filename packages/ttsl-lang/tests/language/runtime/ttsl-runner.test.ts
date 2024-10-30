import { describe, expect, it } from 'vitest';
import { NodeFileSystem } from 'langium/node';
import { URI } from 'langium';
import { createTTSLServices } from '../../../src/language/index.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const runner = services.runtime.Runner;

describe('TTSLRunner', async () => {
    describe('getMainModuleName', async () => {
        it('sds', async () => {
            const document = services.shared.workspace.LangiumDocumentFactory.fromString('', URI.file('/a-b c.ttsl'));
            const mainModuleName = runner.getMainModuleName(document);
            expect(mainModuleName).toBe('a_b_c');
        });
        it('other', async () => {
            const document = services.shared.workspace.LangiumDocumentFactory.fromString(
                '',
                URI.file('/a-b c.sdsdev2'),
            );
            const mainModuleName = runner.getMainModuleName(document);
            expect(mainModuleName).toBe('a_b_c_sdsdev2');
        });
    });
    describe('generateCodeForRunner', async () => {
        it('generateCodeForRunner', async () => {
            const document = services.shared.workspace.LangiumDocumentFactory.fromString(
                'package a\n\nfunction mainFunction() {}',
                URI.file('/b.ttsl'),
            );
            const [programCodeMap] = runner.generateCodeForRunner(document, undefined);
            expect(JSON.stringify(programCodeMap).replaceAll('\\r\\n', '\\n')).toBe(
                '{"a":{"gen_b":"# Functions --------------------------------------------------------------------\\n\\ndef mainFunction():\\n    pass\\n","gen_b_mainFunction":"from .gen_b import mainFunction\\n\\nif __name__ == \'__main__\':\\n    mainFunction()\\n"}}',
            );
        });
    });
});
