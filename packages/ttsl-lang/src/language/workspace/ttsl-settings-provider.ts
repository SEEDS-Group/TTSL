import { ConfigurationProvider, DeepPartial, Disposable } from 'langium';
import { TTSLServices } from '../ttsl-module.js';
import { TTSLLanguageMetaData } from '../generated/module.js';

export class TTSLSettingsProvider {
    private readonly configurationProvider: ConfigurationProvider;

    private watchers = new Set<SettingsWatcher<any>>();

    constructor(services: TTSLServices) {
        this.configurationProvider = services.shared.workspace.ConfigurationProvider;
    }

    async getRunnerCommand(): Promise<string> {
        /* c8 ignore next 2 */
        return (await this.getRunnerSettings()).command ?? 'ttsl-runner';
    }

    async onRunnerCommandUpdate(callback: (newValue: string | undefined) => void): Promise<Disposable> {
        const watcher: SettingsWatcher<string | undefined> = {
            accessor: (settings) => settings.runner?.command,
            callback,
        };

        this.watchers.add(watcher);

        return Disposable.create(() => {
            /* c8 ignore next */
            this.watchers.delete(watcher);
        });
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

    private async getRunnerSettings(): Promise<Partial<RunnerSettings>> {
        return (await this.configurationProvider.getConfiguration(TTSLLanguageMetaData.languageId, 'runner')) ?? {};
    }
}

export interface Settings {
    runner: RunnerSettings;
    validation: ValidationSettings;
}

interface ValidationSettings {
    codeStyle: boolean;
    experimentalLanguageFeature: boolean;
    experimentalLibraryElement: boolean;
    nameConvention: boolean;
}

export interface RunnerSettings {
    command: string;
}

interface SettingsWatcher<T> {
    accessor: (settings: DeepPartial<Settings>) => T;
    callback: (newValue: T) => void;
}