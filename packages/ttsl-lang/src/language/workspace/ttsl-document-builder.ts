import { BuildOptions, DefaultDocumentBuilder } from 'langium';

export class TTSLDocumentBuilder extends DefaultDocumentBuilder {
    override updateBuildOptions: BuildOptions = {
        validation: {
            categories: ['built-in', 'fast'],
            stopAfterLexingErrors: true,
            stopAfterParsingErrors: true,
        },
    };
}
