import { createTTSLServices } from '@ttsl/lang';
import { NodeFileSystem } from 'langium/node';
import { extractDocuments } from '../helpers/documents.js';
import { exitIfDocumentHasSyntaxErrors } from '../helpers/diagnostics.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { writeFile } from 'node:fs/promises';
import chalk from 'chalk';

export const format = async (fsPaths: string[]): Promise<void> => {
    const services = (await createTTSLServices(NodeFileSystem)).TTSL;
    const documents = await extractDocuments(services, fsPaths);

    // Exit if any document has syntax errors before formatting code
    for (const document of documents) {
        exitIfDocumentHasSyntaxErrors(document);
    }

    // Format code
    for (const document of documents) {
        const edits = await services.lsp.Formatter!.formatDocument(document, {
            textDocument: {
                uri: document.uri.toString(),
            },
            options: {
                tabSize: 4,
                insertSpaces: true,
            },
        });

        const editedDocument = TextDocument.applyEdits(document.textDocument, edits);
        await writeFile(document.uri.fsPath, editedDocument);
    }

    console.log(chalk.green(`TTSL code formatted successfully.`));
};
