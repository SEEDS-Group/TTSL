import { TTSLServices } from '../ttsl-module.js';
import { isTslModule, TslModuleMember } from '../generated/ast.js';
import { LangiumDocuments, URI, WorkspaceCache } from 'langium';
import { getModuleMembers } from '../helpers/nodeProperties.js';

export abstract class TTSLModuleMembers<T extends TslModuleMember> {
    private readonly langiumDocuments: LangiumDocuments;
    private readonly cache: WorkspaceCache<string, T>;

    constructor(services: TTSLServices) {
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.cache = new WorkspaceCache(services.shared);
    }

    protected getModuleMember(uri: URI, name: string, predicate: (node: unknown) => node is T): T | undefined {
        const key = `${uri.toString()}#${name}`;

        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const document = this.langiumDocuments.getDocument(uri);
        if (!document) {
            /* c8 ignore next 2 */
            return undefined;
        }

        const root = document.parseResult.value;
        if (!isTslModule(root)) {
            /* c8 ignore next 2 */
            return undefined;
        }

        const firstMatchingModuleMember = getModuleMembers(root).find((m) => m.name === name);
        if (!predicate(firstMatchingModuleMember)) {
            /* c8 ignore next 2 */
            return undefined;
        }

        this.cache.set(key, firstMatchingModuleMember);
        return firstMatchingModuleMember;
    }
}
