import { NodeFileSystem } from 'langium/node';
import { startLanguageServer as doStartLanguageServer } from 'langium/lsp';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { createTTSLServices } from './ttsl-module.js';

/* c8 ignore start */
export const startLanguageServer = async () => {
    // Create a connection to the client
    const connection = createConnection(ProposedFeatures.all);

    // Inject the shared services and language-specific services
    const { shared } = await createTTSLServices({ connection, ...NodeFileSystem });

    // Start the language server with the shared services
    doStartLanguageServer(shared);
};
/* c8 ignore stop */
