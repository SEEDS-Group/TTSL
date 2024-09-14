import { ConfigurationProvider } from 'langium';
import { TTSLServices } from '../ttsl-module.js';
import { TTSLLanguageMetaData } from '../generated/module.js';

export class TTSLSettingsProvider {
    private readonly configurationProvider: ConfigurationProvider;

    constructor(services: TTSLServices) {
        this.configurationProvider = services.shared.workspace.ConfigurationProvider;
    }

    async shouldValidateCodeStyle(): Promise<boolean> {
        return (await this.getValidationSettings()).codeStyle ?? true;
    }

    async shouldValidateExperimentalLanguageFeature(): Promise<boolean> {
        return (await this.getValidationSettings()).experimentalLanguageFeature ?? true;
    }

    async shouldValidateExperimentalLibraryElement(): Promise<boolean> {
        return (await this.getValidationSettings()).experimentalLibraryElement ?? true;
    }

    async shouldValidateNameConvention(): Promise<boolean> {
        return (await this.getValidationSettings()).nameConvention ?? true;
    }

    private async getValidationSettings(): Promise<Partial<ValidationSettings>> {
        return (await this.configurationProvider.getConfiguration(TTSLLanguageMetaData.languageId, 'validation')) ?? {};
    }
}

interface ValidationSettings {
    codeStyle: boolean;
    experimentalLanguageFeature: boolean;
    experimentalLibraryElement: boolean;
    nameConvention: boolean;
}
