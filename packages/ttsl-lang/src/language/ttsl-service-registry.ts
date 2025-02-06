import { DefaultServiceRegistry, URI } from 'langium';
import { TTSLLanguageMetaData } from './generated/module.js';
import { TTSLServices } from './ttsl-module.js';

export class TTSLServiceRegistry extends DefaultServiceRegistry {
    /* c8 ignore start */
    getTTSLServices(): TTSLServices {
        const extension = TTSLLanguageMetaData.fileExtensions[0];
        return this.getServices(URI.file(`any.${extension}`)) as TTSLServices;
    }
    /* c8 ignore stop */
}
